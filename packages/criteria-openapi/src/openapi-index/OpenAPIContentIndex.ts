import { evaluateJSONPointer, unescapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import { ContentIndex, ReferenceInfo, SchemaContentIndex } from '@criteria/json-schema'
import { OpenAPIObjectType, visitOpenAPIObjects } from '../specification/v3.1/visitOpenAPIObjects'
import { URI, resolveURIReference } from '../util/uri'

export interface OpenAPIMetadata {
  type: OpenAPIObjectType
  openAPIVersion: string
  metaSchemaID: string // jsonSchemaDialect
}

export interface OpenAPIInfo {
  baseURI: URI
  metadata: OpenAPIMetadata
}

export class OpenAPIContentIndex implements ContentIndex<OpenAPIMetadata> {
  readonly schemaContentIndex: SchemaContentIndex
  constructor() {
    this.schemaContentIndex = new SchemaContentIndex()
  }

  // Indexes OpenAPI objects and { $ref }
  private openAPIObjectsByURI = new Map<URI, object>()
  private infosByOpenAPIObject = new Map<object, OpenAPIInfo>()

  isObjectIndexed(object: object) {
    if (this.schemaContentIndex.isObjectIndexed(object)) {
      return true
    }
    return this.infosByOpenAPIObject.has(object)
  }

  isURIIndexed(uri: string) {
    if (this.schemaContentIndex.isURIIndexed(uri)) {
      return true
    }
    return this.openAPIObjectsByURI.has(uri)
  }

  indexedObjectWithURI(uri: URI) {
    if (this.schemaContentIndex.isURIIndexed(uri)) {
      return this.schemaContentIndex.indexedObjectWithURI(uri)
    }
    return this.openAPIObjectsByURI.get(uri)
  }

  infoForIndexedObject(object: any) {
    if (this.schemaContentIndex.isObjectIndexed(object)) {
      const info = this.schemaContentIndex.infoForIndexedObject(object)
      return {
        baseURI: info.baseURI,
        metadata: {
          type: 'Schema' as OpenAPIObjectType,
          openAPIVersion: '',
          metaSchemaID: info.metadata.metaSchemaID
        }
      }
    }
    return this.infosByOpenAPIObject.get(object)
  }

  addContentFromRoot(root: any, baseURI: URI, rootMetadata: OpenAPIMetadata) {
    let foundReferences = new Map<object, ReferenceInfo<OpenAPIMetadata>>()

    // TODO: switch on version
    // const visitOpenAPIObjects = (metaSchemaID: string) => {
    //   switch (metaSchemaID) {
    //     case metaSchemaIDDraft2020_12:
    //       return visitSubschemasDraft2020_12
    //     case metaSchemaIDDraft04:
    //       return visitSubschemasDraft04
    //     default:
    //       return visitOpenAPIObjects(rootMetadata.openAPIVersion)
    //   }
    // }

    visitOpenAPIObjects(
      root,
      rootMetadata.type,
      {
        baseURI,
        metadata: {
          openAPIVersion: rootMetadata.openAPIVersion,
          metaSchemaID: rootMetadata.metaSchemaID
        }
      },
      (type, object, path, state) => {
        if (typeof object !== 'object') {
          return
        }

        if (this.infosByOpenAPIObject.has(object)) {
          return
        }

        const {
          baseURI,
          metadata: { openAPIVersion, metaSchemaID }
        } = state

        if (type === 'Schema') {
          const schemaReferences = this.schemaContentIndex.addContentFromRoot(object, baseURI, {
            metaSchemaID
          })

          const location = path.join('')
          const i = location.lastIndexOf('/')
          const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, root)
          const key = unescapeReferenceToken(location.slice(i + 1))

          schemaReferences.forEach((info, reference) => {
            foundReferences.set(reference, {
              resolvedURI: info.resolvedURI,
              parent: info.parent === null ? parent : info.parent,
              key: info.parent === null ? key : info.key,
              metadata: {
                type: 'Schema',
                openAPIVersion: rootMetadata.openAPIVersion,
                metaSchemaID: info.metadata.metaSchemaID
              },
              isDynamic: info.isDynamic,
              path: [...path, ...info.path]
            })
          })
        } else {
          this.infosByOpenAPIObject.set(object, {
            baseURI: baseURI,
            metadata: {
              type,
              openAPIVersion,
              metaSchemaID
            }
          })

          if ('$ref' in object && typeof object.$ref === 'string') {
            const $ref = resolveURIReference(object.$ref, state.baseURI)

            const location = path.join('')
            const i = location.lastIndexOf('/')
            const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, root)
            const key = unescapeReferenceToken(location.slice(i + 1))

            // Don't retrieve yet, because it may resolve to a nested schema with an id
            foundReferences.set(object, {
              resolvedURI: $ref,
              parent,
              key,
              metadata: {
                type,
                openAPIVersion,
                metaSchemaID
              },
              isDynamic: false,
              path
            })
          }
        }
      }
    )

    return foundReferences
  }
}
