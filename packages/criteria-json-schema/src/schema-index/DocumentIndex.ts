import { evaluateJSONPointer } from '@criteria/json-pointer'
import { memoize, retrieveBuiltin } from '../retrievers'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, hasFragment, resolveURIReference, splitFragment } from '../util/uri'
import { isJSONReference } from '../util/visitJSONReferences'
import { Index } from './types'

// default configuration
const defaultCloned = false
const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}

export interface DocumentInfo {
  baseURI: URI
}

export interface DocumentIndexConfiguration {
  cloned?: boolean
  retrieve?: (uri: URI) => any
}

export abstract class DocumentIndex implements Index<never> {
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

  private documentsByURI = new Map<string, any>()
  private infosByDocument = new Map<object, DocumentInfo>()

  root() {
    for (const document of this.documentsByURI.values()) {
      return document
    }
    return undefined
  }

  isObjectIndexed(object: object) {
    return this.infosByDocument.has(object)
  }

  isURIIndexed(uri: URI) {
    return this.documentsByURI.has(uri)
  }

  indexedObjectWithURI(uri: URI) {
    return this.documentsByURI.get(uri)
  }

  infoForIndexedObject(value: any) {
    if (this.infosByDocument.has(value)) {
      return this.infosByDocument.get(value)
    }
    return undefined
  }

  find(uri: URI, options?: { followReferences: boolean; _uris?: Set<URI> }) {
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

    const value = this.indexedObjectWithURI(uri)
    if (value !== undefined) {
      const baseURI = this.infoForIndexedObject(value)?.baseURI
      return followReferences && typeof value === 'object' ? followReference(value, baseURI) : value
    }

    const { absoluteURI, fragment } = splitFragment(uri)
    if (absoluteURI !== uri && isJSONPointer(fragment)) {
      const container = this.find(absoluteURI, options) // can followReferences be folded into findIndex?
      const evaluatedValue = evaluateJSONPointer(fragment, container)
      if (evaluatedValue !== undefined) {
        const baseURI = this.infoForIndexedObject(container)?.baseURI
        return followReferences ? followReference(evaluatedValue, baseURI) : evaluatedValue
      }

      if (followReferences) {
        if (fragment === '') {
          return container
        }

        const i = uri.lastIndexOf('/')
        const parentURI = uri.slice(0, i)
        const remainingFragment = uri.slice(i) as JSONPointer

        let parent = this.find(parentURI, options)
        const evaluatedValue = evaluateJSONPointer(remainingFragment, parent) // try evaluating against siblings of $ref
        if (evaluatedValue !== undefined) {
          const baseURI = this.infoForIndexedObject(parent)?.baseURI
          return followReferences === true ? followReference(evaluatedValue, baseURI) : evaluatedValue
        }

        if (typeof parent === 'object' && '$ref' in parent) {
          if (typeof parent.$ref == 'object') {
            parent = parent.$ref
          } else {
            const baseURI = this.infoForIndexedObject(parent)?.baseURI ?? this.infoForIndexedObject(container)?.baseURI
            const parentRefURI = resolveURIReference(parent.$ref, baseURI)
            parent = this.find(parentRefURI, options)
          }

          const evaluatedValue = evaluateJSONPointer(remainingFragment, parent)

          if (evaluatedValue !== undefined) {
            const baseURI = this.infoForIndexedObject(parent)?.baseURI
            return options?.followReferences === true ? followReference(evaluatedValue, baseURI) : evaluatedValue
          }
        }
      }
    }

    return undefined
  }

  addDocument(document: object, baseURI: URI) {
    // TODO: assert baseURI is absolute..

    if (this.cloned) {
      document = structuredClone(document)
    }

    const { absoluteURI, fragment } = splitFragment(baseURI)
    this.documentsByURI.set(absoluteURI, document)

    if (typeof document === 'object') {
      this.infosByDocument.set(document, {
        baseURI: absoluteURI
      })
    }

    return document
  }

  addDocumentWithURI(uri: URI) {
    if (hasFragment(uri)) {
      throw new Error(`Document URI is not absolute: ${uri}`)
    }

    if (this.isURIIndexed(uri)) {
      return
    }

    let document
    try {
      document = this.retrieve(uri)
    } catch (error) {
      throw new Error(`Failed to retrieve document at uri '${uri}'`)
    }

    return this.addDocument(document, uri)
  }
}
