import { evaluateJSONPointer, isJSONPointer } from '@criteria/json-pointer'
import { DocumentIndex, ReferenceInfo, metaSchemaIDDraft2020_12 } from '@criteria/json-schema'
import { OpenAPIContentIndex } from '../openapi-index/OpenAPIContentIndex'
import { OpenAPIObjectType } from '../specification/v3.1/visitOpenAPIObjects'
import { MaybePromise, chain, chainForEach } from '../util/promises'
import { URI, splitFragment } from '../util/uri'

// default configuration
const defaultDefaultJSONSchemaDialect = metaSchemaIDDraft2020_12

export interface Metadata {
  type: OpenAPIObjectType | null
  openAPIVersion: string
  metaSchemaID: string // jsonSchemaDialect
}

export interface OpenAPIIndexConfiguration {
  defaultJSONSchemaDialect?: URI
  cloned?: boolean
  retrieve?: (uri: URI) => MaybePromise<any>
}

export class OpenAPIIndex extends DocumentIndex {
  readonly openAPIContentIndex: OpenAPIContentIndex
  readonly defaultJSONSchemaDialect: URI
  constructor(configuration: OpenAPIIndexConfiguration) {
    super({
      cloned: configuration.cloned,
      retrieve: configuration.retrieve
    })
    this.openAPIContentIndex = new OpenAPIContentIndex()
    this.defaultJSONSchemaDialect = configuration.defaultJSONSchemaDialect ?? defaultDefaultJSONSchemaDialect
  }

  readonly references = new Map<object, ReferenceInfo<Metadata>>()

  override isObjectIndexed(object: object): boolean {
    if (this.openAPIContentIndex.isObjectIndexed(object)) {
      return true
    }
    return super.isObjectIndexed(object)
  }

  override isURIIndexed(uri: string): boolean {
    if (this.openAPIContentIndex.isURIIndexed(uri)) {
      return true
    }
    return super.indexedObjectWithURI(uri)
  }

  override indexedObjectWithURI(uri: URI) {
    if (this.openAPIContentIndex.isURIIndexed(uri)) {
      return this.openAPIContentIndex.indexedObjectWithURI(uri)
    }
    return super.indexedObjectWithURI(uri)
  }

  override infoForIndexedObject(object: any) {
    if (this.openAPIContentIndex.isObjectIndexed(object)) {
      return this.openAPIContentIndex.infoForIndexedObject(object)
    }
    return super.infoForIndexedObject(object)
  }

  addRootOpenAPI(rootOpenAPI: object, baseURI: URI): MaybePromise<void> {
    rootOpenAPI = this.addDocument(rootOpenAPI, baseURI)

    const rootOpenAPIMetadata = {
      type: 'openapi' as OpenAPIObjectType,
      openAPIVersion: (rootOpenAPI as any).openapi,
      metaSchemaID: (rootOpenAPI as any).jsonSchemaDialect ?? this.defaultJSONSchemaDialect
    }

    return this.addOpenAPIObjects(rootOpenAPI, baseURI, rootOpenAPIMetadata)
  }

  addOpenAPIObjects(rootObject: object, baseURI: URI, metadata: Metadata): MaybePromise<void> {
    const foundReferences = this.openAPIContentIndex.addContentFromRoot(rootObject, baseURI, metadata)
    foundReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

    // Help prevent Maximum call stack size exceeded errors
    const unindexedReferences = [...foundReferences.values()].filter((info) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return false
      }
      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)
      return !this.isURIIndexed(absoluteURI)
    })

    return chainForEach(unindexedReferences.values(), (info: ReferenceInfo<Metadata>) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let documentOrPromise
      if (this.isURIIndexed(absoluteURI)) {
        // documentOrPromise = this.indexedObjectWithURI(absoluteURI)
      } else {
        documentOrPromise = this.addDocumentWithURI(absoluteURI)
      }

      return chain(documentOrPromise, (document) => {
        if (document) {
          if (fragment && isJSONPointer(fragment)) {
            const rootObject = evaluateJSONPointer(fragment, document)
            if (rootObject) {
              return this.addOpenAPIObjects(rootObject, info.resolvedURI, info.metadata)
            }
          } else {
            return this.addOpenAPIObjects(document, absoluteURI, info.metadata)
          }
        }
      })
    })
  }
}
