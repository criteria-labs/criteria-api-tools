import { evaluateJSONPointer, unescapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import { metaSchemaID as metaSchemaIDDraft04 } from '../draft-04'
import { metaSchemaID as metaSchemaIDDraft06 } from '../draft-06'
import { metaSchemaID as metaSchemaIDDraft07 } from '../draft-07'
import { metaSchemaID as metaSchemaIDDraft2020_12 } from '../draft-2020-12'
import { resolveID as resolveIDDraft04 } from '../specification/draft-04/resolveID'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { resolveID as resolveIDDraft06 } from '../specification/draft-06/resolveID'
import { visitSubschemas as visitSubschemasDraft06 } from '../specification/draft-06/visitSubschemas'
import { resolveID as resolveIDDraft07 } from '../specification/draft-07/resolveID'
import { visitSubschemas as visitSubschemasDraft07 } from '../specification/draft-07/visitSubschemas'
import { resolveID as resolveIDDraft2020_12 } from '../specification/draft-2020-12/resolveID'
import { visitSubschemas as visitSubschemasDraft2020_12 } from '../specification/draft-2020-12/visitSubschemas'
import { URI, resolveURIReference } from '../util/uri'
import { ContentIndex, ReferenceInfo } from './types'

export interface SchemaMetadata {
  metaSchemaID: URI
}

export interface SchemaInfo {
  baseURI: URI
  metadata: SchemaMetadata
}

export class SchemaContentIndex implements ContentIndex<SchemaMetadata> {
  constructor() {}

  // Indexes schemas and { $ref }
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private infosBySchema = new Map<object, SchemaInfo>()

  isObjectIndexed(object: object) {
    if (this.infosBySchema.has(object)) {
      return true
    }
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
    return undefined
  }

  addContentFromRoot(root: any, baseURI: URI, rootMetadata: SchemaMetadata) {
    let foundReferences = new Map<object, ReferenceInfo<SchemaMetadata>>()

    const visitSubschemas = (metaSchemaID: string) => {
      switch (metaSchemaID) {
        case metaSchemaIDDraft04:
          return visitSubschemasDraft04
        case metaSchemaIDDraft06:
          return visitSubschemasDraft06
        case metaSchemaIDDraft07:
          return visitSubschemasDraft07
        case metaSchemaIDDraft2020_12:
          return visitSubschemasDraft2020_12
        default:
          return visitSubschemas(rootMetadata.metaSchemaID)
      }
    }

    visitSubschemas(typeof root === 'object' && '$schema' in root ? root.$schema : rootMetadata.metaSchemaID)(
      root,
      {
        baseURI,
        metadata: {
          metaSchemaID: rootMetadata.metaSchemaID
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
          metadata: { metaSchemaID }
        } = state

        const $schema = '$schema' in subschema ? subschema.$schema : metaSchemaID

        let $id: string | undefined
        switch ($schema) {
          case metaSchemaIDDraft04: {
            $id = resolveIDDraft04(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
          case metaSchemaIDDraft06: {
            $id = resolveIDDraft06(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
          case metaSchemaIDDraft07: {
            $id = resolveIDDraft07(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
          case metaSchemaIDDraft2020_12: {
            $id = resolveIDDraft2020_12(subschema, baseURI)
            if ($id) {
              this.schemasByURI.set($id, subschema)
            }
            break
          }
        }

        this.infosBySchema.set(subschema, {
          baseURI: $id ?? baseURI,
          metadata: {
            metaSchemaID: $schema
          }
        })

        state.baseURI = $id ?? baseURI
        state.metadata = {
          metaSchemaID: $schema
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
          const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, root)
          const key = unescapeReferenceToken(location.slice(i + 1))

          // Don't retrieve yet, because it may resolve to a nested schema with an id
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
          const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, root)
          const key = unescapeReferenceToken(location.slice(i + 1))

          // Don't retrieve yet, because it may resolve to a nested schema with an id
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
