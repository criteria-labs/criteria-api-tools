import { evaluateJSONPointer } from '@criteria/json-pointer'
import { DocumentIndex, ReferenceInfo, metaSchemaURIDraft2020_12 } from '@criteria/json-schema'
import { OpenAPIContentIndex } from '../openapi-index/OpenAPIContentIndex'
import { OpenAPIObjectType } from '../specification/v3.1/visitOpenAPIObjects'
import { isJSONPointer } from '../util/JSONPointer'
import { URI, splitFragment } from '../util/uri'

// default configuration
const defaultDefaultJSONSchemaDialect = metaSchemaURIDraft2020_12

export interface Metadata {
  type: OpenAPIObjectType | null
  openAPIVersion: string
  metaSchemaURI: string // jsonSchemaDialect
}

export interface OpenAPIIndexConfiguration {
  defaultJSONSchemaDialect?: URI
  cloned?: boolean
  retrieve?: (uri: URI) => any
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

  addRootOpenAPI(rootOpenAPI: object, baseURI: URI) {
    rootOpenAPI = this.addDocument(rootOpenAPI, baseURI)

    const rootOpenAPIMetadata = {
      type: 'openapi' as OpenAPIObjectType,
      openAPIVersion: (rootOpenAPI as any).openapi,
      metaSchemaURI: (rootOpenAPI as any).jsonSchemaDialect ?? this.defaultJSONSchemaDialect
    }

    this.addOpenAPIObjects(rootOpenAPI, baseURI, rootOpenAPIMetadata)
  }

  addOpenAPIObjects(rootObject: object, baseURI: URI, metadata: Metadata) {
    const foundReferences = this.openAPIContentIndex.addContentFromRoot(rootObject, baseURI, metadata)
    foundReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

    foundReferences.forEach((info, reference) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let document
      if (this.isURIIndexed(absoluteURI)) {
        // document = this.indexedObjectWithURI(absoluteURI)
      } else {
        document = this.addDocumentWithURI(absoluteURI)
      }

      if (document) {
        if (fragment && isJSONPointer(fragment)) {
          const rootObject = evaluateJSONPointer(fragment, document)
          if (rootObject) {
            this.addOpenAPIObjects(rootObject, info.resolvedURI, info.metadata)
          }
        } else {
          this.addOpenAPIObjects(document, absoluteURI, info.metadata)
        }
      }
    })
  }
}
