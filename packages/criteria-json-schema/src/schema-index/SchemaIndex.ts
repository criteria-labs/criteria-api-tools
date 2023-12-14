import { evaluateJSONPointer, unescapeReferenceToken } from '@criteria/json-pointer'
import { resolveID as resolveIDDraft04 } from '../specification/draft-04/resolveID'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { resolveID as resolveIDDraft2020_12 } from '../specification/draft-2020-12/resolveID'
import { visitSubschemas as visitSubschemasDraft2020_12 } from '../specification/draft-2020-12/visitSubschemas'
import { JSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference } from '../util/uri'
import { Index } from './Index'

export interface Metadata {
  metaSchemaURI: URI
}

export interface SchemaInfo {
  baseURI: URI
  metadata: Metadata
}

export interface ReferenceInfo {
  resolvedURI: URI
  parent: any | null
  key: string
  metadata: Metadata
  isDynamic: boolean
  path: JSONPointer[]
}

export interface SchemaIndexConfiguration {
  foundReference: (reference: object, info: ReferenceInfo) => void
}

export class SchemaIndex implements Index<Metadata> {
  private foundReference: (reference: object, info: ReferenceInfo) => void
  constructor(configuration: SchemaIndexConfiguration) {
    this.foundReference = configuration.foundReference
  }

  // Indexes schemas and { $ref }
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private infosBySchema = new Map<object, SchemaInfo>()

  // Indexes { $ref } in locations that are not schemas
  // private infosByJSONReference = new Map<object, SchemaInfo>()

  isObjectIndexed(object: object) {
    if (this.infosBySchema.has(object)) {
      return true
    }
    // if (this.infosByJSONReference.has(object)) {
    //   return true
    // }
    return false
  }

  isURIIndexed(uri: string) {
    if (this.schemasByURI.has(uri)) {
      return true
    }
    if (this.schemasByAnchors.has(uri)) {
      return true
    }
    if (this.schemasByDynamicAnchors.has(uri)) {
      return true
    }
    return false
  }

  indexedObjectWithURI(uri: URI) {
    let schema = this.schemasByURI.get(uri)
    if (schema !== undefined) {
      return schema
    }

    schema = this.schemasByAnchors.get(uri)
    if (schema !== undefined) {
      return schema
    }

    schema = this.schemasByDynamicAnchors.get(uri)
    if (schema !== undefined) {
      return schema
    }

    return undefined
  }

  infoForIndexedObject(value: any): SchemaInfo | undefined {
    if (this.infosBySchema.has(value)) {
      return this.infosBySchema.get(value)
    }
    // if (this.infosByJSONReference.has(value)) {
    //   return this.infosByJSONReference.get(value)
    // }
    return undefined
  }

  addSchemasFromRootObject(rootObject: object, baseURI: URI, rootObjectMetadata: Metadata) {
    let foundReferences = new Map<object, ReferenceInfo>()

    const visitSubschemas = (metaSchemaURI: string) => {
      switch (metaSchemaURI) {
        case 'https://json-schema.org/draft/2020-12/schema':
          return visitSubschemasDraft2020_12
        case 'http://json-schema.org/draft-04/schema#':
          return visitSubschemasDraft04
        default:
          return visitSubschemas(rootObjectMetadata.metaSchemaURI)
      }
    }

    visitSubschemas(rootObjectMetadata.metaSchemaURI)(
      rootObject,
      {
        baseURI,
        metadata: {
          metaSchemaURI: rootObjectMetadata.metaSchemaURI
        }
      },
      (subschema, path, state) => {
        if (typeof subschema === 'boolean') {
          return
        }

        if (this.infosBySchema.has(subschema)) {
          return
        }

        const {
          baseURI,
          metadata: { metaSchemaURI }
        } = state

        const $schema = '$schema' in subschema ? subschema.$schema : metaSchemaURI

        let $id: string | undefined
        switch ($schema) {
          case 'https://json-schema.org/draft/2020-12/schema': {
            $id = resolveIDDraft2020_12(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
          case 'http://json-schema.org/draft-04/schema#': {
            $id = resolveIDDraft04(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
        }

        this.infosBySchema.set(subschema, {
          baseURI: $id ?? baseURI,
          metadata: {
            metaSchemaURI: $schema
          }
        })

        state.baseURI = $id ?? baseURI
        state.metadata = {
          metaSchemaURI: $schema
        }

        let $anchor: string | undefined
        if ('$anchor' in subschema && typeof subschema.$anchor === 'string') {
          $anchor = resolveURIReference(`#${subschema.$anchor}`, $id ?? baseURI)
          this.schemasByAnchors.set($anchor, subschema)
        }

        let $dynamicAnchor: string | undefined
        if ('$dynamicAnchor' in subschema && typeof subschema.$dynamicAnchor === 'string') {
          $dynamicAnchor = resolveURIReference(`#${subschema.$dynamicAnchor}`, $id ?? baseURI)
          this.schemasByDynamicAnchors.set($dynamicAnchor, subschema)
        }

        if ('$ref' in subschema && typeof subschema.$ref === 'string') {
          const $ref = resolveURIReference(subschema.$ref, $id ?? baseURI)

          // TODO: test location is from rootObject, where initial location supplied
          const location = path.join('')
          const i = location.lastIndexOf('/')
          const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, rootObject)
          const key = unescapeReferenceToken(location.slice(i + 1))

          // Don't retrieve yet, because it may resolve to a nested schema with an id
          // references.set($ref, { location: '' })
          this.foundReference(subschema, {
            resolvedURI: $ref,
            parent,
            key,
            metadata: state.metadata,
            isDynamic: false,
            path
          })
          foundReferences.set(subschema, {
            resolvedURI: $ref,
            parent,
            key,
            metadata: state.metadata,
            isDynamic: false,
            path
          })
        }

        if ('$dynamicRef' in subschema && typeof subschema.$dynamicRef === 'string') {
          const $dynamicRef = resolveURIReference(subschema.$dynamicRef, $id ?? baseURI)

          // TODO: test location is from rootObject, where initial location supplied
          const location = path.join('')
          const i = location.lastIndexOf('/')
          const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, rootObject)
          const key = unescapeReferenceToken(location.slice(i + 1))

          // Don't retrieve yet, because it may resolve to a nested schema with an id
          // references.set($dynamicRef, { location: '' })
          this.foundReference(subschema, {
            resolvedURI: $dynamicRef,
            parent,
            key,
            metadata: state.metadata,
            isDynamic: true,
            path
          })
          foundReferences.set(subschema, {
            resolvedURI: $dynamicRef,
            parent,
            key,
            metadata: state.metadata,
            isDynamic: true,
            path
          })
        }
      }
    )

    return foundReferences
  }
}
