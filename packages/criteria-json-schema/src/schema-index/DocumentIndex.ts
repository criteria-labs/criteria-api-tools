import { evaluateJSONPointer } from '@criteria/json-pointer'
import { memoize, retrieveBuiltin } from '../retrievers'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference, splitFragment } from '../util/uri'
import { isJSONReference } from '../util/visitJSONReferences'

// default configuration
export const defaultCloned = false
const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}

export interface DocumentInfo<AdditionalInfo> {
  baseURI: URI
  additionalInfo: AdditionalInfo
}

export interface DocumentIndexConfiguration {
  cloned?: boolean
  retrieve?: (uri: URI) => any
}

export class DocumentIndex<AdditionalInfo> {
  readonly cloned: boolean
  readonly retrieve: (uri: URI) => any
  constructor(configuration: DocumentIndexConfiguration) {
    this.cloned = configuration.cloned ?? defaultCloned
    this.retrieve = memoize((uri: string) => {
      const document = retrieveBuiltin(uri) ?? configuration?.retrieve(uri) ?? defaultRetrieve(uri)
      if (!document) {
        throw new Error(`Invalid document retrieved at uri '${uri}'`)
      }
      return document
    })
  }

  // Indexes documents
  private documentsByURI = new Map<string, any>()
  private infosByDocument = new Map<object, DocumentInfo<AdditionalInfo>>()

  rootDocument() {
    for (const document of this.documentsByURI.values()) {
      return document
    }
    return undefined
  }

  hasDocument(document: object) {
    return this.infosByDocument.has(document)
  }

  hasDocumentWithURI(uri: URI) {
    return this.documentsByURI.has(uri)
  }

  getDocument(uri: URI) {
    return this.documentsByURI.get(uri)
  }

  documentURIs() {
    return this.documentsByURI.keys()
  }

  infoForDocument(document: any): DocumentInfo<AdditionalInfo> {
    return this.infosByDocument.get(document)
  }

  findParent(location: JSONPointer, document: any) {
    if (location === '') {
      return undefined
    }
    const i = location.lastIndexOf('/')
    const parentLocation = location.slice(0, i) as JSONPointer
    return evaluateJSONPointer(parentLocation, document)
  }

  find(uri: URI, options?: { followReferences: boolean; _uris?: Set<URI> }): any {
    const followReferences = options?.followReferences ?? false
    const _uris = options?._uris ?? new Set()

    const followReference = (value: any, baseURI: URI) => {
      if (isJSONReference(value) && Object.keys(value).length === 1) {
        if (typeof value.$ref === 'string') {
          const followedURI = resolveURIReference(value.$ref, baseURI)
          if (_uris.has(followedURI)) {
            return {}
          }
          return this.find(followedURI, { ...options, _uris })
        } else {
          return value.$ref
        }
      }
      return value
    }

    _uris.add(uri)

    // TODO: delegate to find indexed schemas?

    const document = this.documentsByURI.get(uri)
    if (document !== undefined) {
      return followReferences && typeof document === 'object'
        ? followReference(document, this.infosByDocument.get(document).baseURI)
        : document
    }
  }

  static findAnywhere(
    uri: URI,
    findIndexed: (uri: URI, options: { followReferences: boolean; _uris?: Set<URI> }) => any | undefined,
    baseURIForValue: (value: any) => URI | undefined,
    options: { followReferences: boolean; _uris?: Set<URI> }
  ) {
    const followReferences = options?.followReferences ?? false
    const _uris = options?._uris ?? new Set()

    const followReference = (value: any, baseURI: URI) => {
      if (isJSONReference(value) && Object.keys(value).length === 1) {
        if (typeof value.$ref === 'string') {
          const followedURI = resolveURIReference(value.$ref, baseURI)
          if (_uris.has(followedURI)) {
            return {}
          }
          return DocumentIndex.findAnywhere(followedURI, findIndexed, baseURIForValue, { ...options, _uris })
        } else {
          return value.$ref
        }
      }
      return value
    }

    _uris.add(uri)

    const value = findIndexed(uri, options)
    if (value !== undefined) {
      return followReferences && typeof value === 'object' ? followReference(value, baseURIForValue(value)) : value
    }

    const { absoluteURI, fragment } = splitFragment(uri)
    if (absoluteURI !== uri && isJSONPointer(fragment)) {
      const container = this.findAnywhere(absoluteURI, findIndexed, baseURIForValue, options) // can followReferences be folded into findIndex?
      const evaluatedValue = evaluateJSONPointer(fragment, container)
      if (evaluatedValue !== undefined) {
        const baseURI = baseURIForValue(container)
        return followReferences ? followReference(evaluatedValue, baseURI) : evaluatedValue
      }

      if (followReferences) {
        if (fragment === '') {
          return container
        }

        const i = uri.lastIndexOf('/')
        const parentURI = uri.slice(0, i)
        const remainingFragment = uri.slice(i) as JSONPointer

        let parent = DocumentIndex.findAnywhere(parentURI, findIndexed, baseURIForValue, options)
        const evaluatedValue = evaluateJSONPointer(remainingFragment, parent) // try evaluating against siblings of $ref
        if (evaluatedValue !== undefined) {
          const baseURI = baseURIForValue(parent)
          return followReferences === true ? followReference(evaluatedValue, baseURI) : evaluatedValue
        }

        if (typeof parent === 'object' && '$ref' in parent) {
          if (typeof parent.$ref == 'object') {
            parent = parent.$ref
          } else {
            const baseURI = baseURIForValue(parent)
            const parentRefURI = resolveURIReference(parent.$ref, baseURI)
            parent = DocumentIndex.findAnywhere(parentRefURI, findIndexed, baseURIForValue, options)
          }

          const evaluatedValue = evaluateJSONPointer(remainingFragment, parent)

          if (evaluatedValue !== undefined) {
            const baseURI = baseURIForValue(parent)
            return options?.followReferences === true ? followReference(evaluatedValue, baseURI) : evaluatedValue
          }
        }
      }
    }

    return undefined
  }

  addDocument(
    document: object,
    documentURI: URI,
    additionalInfo: AdditionalInfo,
    collectUnretrievedURIs: (
      document: object,
      documentURI: string,
      additionalInfo: AdditionalInfo
    ) => Map<URI, AdditionalInfo>
  ) {
    const { absoluteURI } = splitFragment(documentURI)

    if (this.cloned) {
      document = structuredClone(document)
    }

    this.documentsByURI.set(absoluteURI, document)
    if (typeof document === 'object') {
      this.infosByDocument.set(document, {
        baseURI: absoluteURI,
        additionalInfo
      })
    }

    const unretrievedURIs = collectUnretrievedURIs(document, documentURI, additionalInfo)

    unretrievedURIs.forEach((externalDocumentAdditionalInfo, externalDocumentURI) => {
      let externalDocument
      try {
        const { absoluteURI } = splitFragment(externalDocumentURI)
        externalDocument = this.retrieve(absoluteURI)
      } catch (error) {
        throw new Error(`Failed to retrieve document at uri '${externalDocumentURI}': ${error.message}`)
      }

      this.addDocument(externalDocument, externalDocumentURI, externalDocumentAdditionalInfo, collectUnretrievedURIs)
    })
  }
}
