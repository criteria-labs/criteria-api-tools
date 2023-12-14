import { evaluateJSONPointer, unescapeReferenceToken } from '@criteria/json-pointer'
import { ContentIndex, ReferenceInfo, SchemaContentIndex, metaSchemaURIDraft2020_12 } from '@criteria/json-schema'
import { OpenAPIObjectType, visitOpenAPIObjects } from '../specification/v3.1/visitOpenAPIObjects'
import { JSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference } from '../util/uri'

export interface OpenAPIMetadata {
  type: OpenAPIObjectType
  openAPIVersion: string
  metaSchemaURI: string // jsonSchemaDialect
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
          type: 'schema' as OpenAPIObjectType,
          openAPIVersion: '',
          metaSchemaURI: info.metadata.metaSchemaURI
        }
      }
    }
    return this.infosByOpenAPIObject.get(object)
  }

  addContentFromRoot(root: any, baseURI: URI, rootMetadata: OpenAPIMetadata) {
    let foundReferences = new Map<object, ReferenceInfo<OpenAPIMetadata>>()

    // TODO: switch on version
    // const visitOpenAPIObjects = (metaSchemaURI: string) => {
    //   switch (metaSchemaURI) {
    //     case 'https://json-schema.org/draft/2020-12/schema':
    //       return visitSubschemasDraft2020_12
    //     case 'http://json-schema.org/draft-04/schema#':
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
          metaSchemaURI: rootMetadata.metaSchemaURI
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
          metadata: { openAPIVersion, metaSchemaURI }
        } = state

        if (type === 'schema') {
          const schemaReferences = this.schemaContentIndex.addContentFromRoot(object, baseURI, {
            metaSchemaURI
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
                type: 'schema',
                openAPIVersion: rootMetadata.openAPIVersion,
                metaSchemaURI: info.metadata.metaSchemaURI
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
              metaSchemaURI
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
                metaSchemaURI
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
