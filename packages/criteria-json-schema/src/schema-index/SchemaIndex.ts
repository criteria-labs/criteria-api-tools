import { evaluateJSONPointer } from '@criteria/json-pointer'
import { resolveID as resolveIDDraft04 } from '../specification/draft-04/resolveID'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { metaSchemaURI as metaSchemaURIDraft2020_12 } from '../specification/draft-2020-12/metaSchemaURI'
import { resolveID as resolveIDDraft2020_12 } from '../specification/draft-2020-12/resolveID'
import { visitSubschemas as visitSubschemasDraft2020_12 } from '../specification/draft-2020-12/visitSubschemas'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference, splitFragment } from '../util/uri'
import { visitJSONReferences } from '../util/visitJSONReferences'
import { DocumentIndex } from './DocumentIndex'

// default configuration
const defaultDefaultMetaSchemaURI = metaSchemaURIDraft2020_12 // yes, defaultDefault...

export interface SchemaInfo {
  baseURI: URI
  metadata: Metadata
}

export interface Metadata {
  metaSchemaURI: URI
  locationFromNearestSchema: JSONPointer
}

export interface SchemaIndexIsolatedConfiguration {
  defaultMetaSchemaURI: URI
}

export class SchemaIndexIsolated {
  readonly defaultMetaSchemaURI: URI
  constructor(configuration: SchemaIndexIsolatedConfiguration) {
    this.defaultMetaSchemaURI = configuration?.defaultMetaSchemaURI ?? defaultDefaultMetaSchemaURI
  }

  // Indexes schemas and { $ref }
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private infosBySchema = new Map<object, SchemaInfo>()

  // Indexes { $ref } in locations that are not schemas
  private infosByJSONReference = new Map<object, SchemaInfo>()

  findWithURI(uri: URI) {
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

  infoForValue(value: any): SchemaInfo | undefined {
    if (this.infosBySchema.has(value)) {
      return this.infosBySchema.get(value)
    }
    if (this.infosByJSONReference.has(value)) {
      return this.infosByJSONReference.get(value)
    }
    return undefined
  }

  addSchemasFromDocument(root: object, locationFromNearestSchema: JSONPointer, document: any, documentURI: URI) {
    let references = new Map<URI, { location: JSONPointer }>()

    const visitSubschemas = (metaSchemaURI: string) => {
      switch (metaSchemaURI) {
        case 'https://json-schema.org/draft/2020-12/schema':
          return visitSubschemasDraft2020_12
        case 'http://json-schema.org/draft-04/schema#':
          return visitSubschemasDraft04
        default:
          return visitSubschemas(this.defaultMetaSchemaURI)
      }
    }

    visitSubschemas(this.defaultMetaSchemaURI)(
      root,
      locationFromNearestSchema,
      {
        baseURI: documentURI,
        metadata: {
          metaSchemaURI: this.defaultMetaSchemaURI
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
            metaSchemaURI: $schema,
            locationFromNearestSchema: ''
          }
        })

        state.baseURI = $id ?? baseURI
        state.metadata = {
          metaSchemaURI: $schema,
          locationFromNearestSchema: ''
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
          // Don't retrieve yet, because it may resolve to a nested schema with an id
          references.set($ref, { location: '' })
        }

        if ('$dynamicRef' in subschema && typeof subschema.$dynamicRef === 'string') {
          const $dynamicRef = resolveURIReference(subschema.$dynamicRef, $id ?? baseURI)
          // Don't retrieve yet, because it may resolve to a nested schema with an id
          references.set($dynamicRef, { location: '' })
        }
      }
    )

    // technically shouldn't need this, but used for non-standard $refs
    visitJSONReferences(
      document,
      {
        baseURI: documentURI,
        metadata: {
          metaSchemaURI: this.defaultMetaSchemaURI
        }
      },
      (reference, location, state) => {
        if (this.infosBySchema.has(reference)) {
          return
        }
        if (this.infosByJSONReference.has(reference)) {
          return
        }

        const {
          baseURI,
          metadata: { metaSchemaURI }
        } = state

        this.infosByJSONReference.set(reference, {
          baseURI,
          metadata: {
            metaSchemaURI,
            locationFromNearestSchema: `${locationFromNearestSchema}${location}`
          }
        })

        const uri = resolveURIReference(reference.$ref, baseURI)
        if (references.has(uri)) {
          return
        }

        references.set(uri, {
          location: `${locationFromNearestSchema}${location}`
        })
      }
    )

    let unretrievedURIs = new Map<URI, Metadata>()
    references.forEach(({ location }, reference) => {
      if (this.schemasByURI.has(reference)) {
        return
      }
      if (this.schemasByAnchors.has(reference)) {
        return
      }
      if (this.schemasByDynamicAnchors.has(reference)) {
        return
      }

      const { absoluteURI } = splitFragment(reference)
      if (this.schemasByURI.has(absoluteURI)) {
        return
      }
      if (this.schemasByAnchors.has(absoluteURI)) {
        return
      }
      if (this.schemasByDynamicAnchors.has(absoluteURI)) {
        return
      }

      unretrievedURIs.set(reference, {
        metaSchemaURI: this.defaultMetaSchemaURI,
        locationFromNearestSchema: location
      })
    })
    return unretrievedURIs
  }
}

export interface SchemaIndexConfiguration {
  cloned?: boolean
  retrieve?: (uri: URI) => any
  defaultMetaSchemaURI: URI
}

export class SchemaIndex {
  // Indexes documents
  private documentIndex: DocumentIndex<Metadata>
  private schemaIndex: SchemaIndexIsolated

  readonly retrieve: (uri: URI) => any
  readonly defaultMetaSchemaURI: string

  constructor(configuration: SchemaIndexConfiguration) {
    this.schemaIndex = new SchemaIndexIsolated({
      defaultMetaSchemaURI: configuration.defaultMetaSchemaURI
    })

    this.documentIndex = new DocumentIndex<Metadata>({
      cloned: configuration.cloned,
      retrieve: configuration.retrieve,
      findWithURI: (uri: URI) => {
        return this.schemaIndex.findWithURI(uri)
      },
      infoForValue: (value: any) => {
        return this.schemaIndex.infoForValue(value)
      },
      onDocumentAdded: (document, documentURI, documentMetadata) => {
        const { fragment } = splitFragment(documentURI)
        const rootSchema = fragment && isJSONPointer(fragment) ? evaluateJSONPointer(fragment, document) : document
        const unretrievedURIs = this.schemaIndex.addSchemasFromDocument(
          rootSchema,
          documentMetadata.locationFromNearestSchema,
          document,
          documentURI
        )

        let result = new Map<URI, Metadata>()
        unretrievedURIs.forEach(({ metaSchemaURI, locationFromNearestSchema }, unretrievedURI) => {
          const isSchema = locationFromNearestSchema === ''
          const { absoluteURI, fragment } = splitFragment(unretrievedURI)
          if (this.documentIndex.hasDocumentWithURI(absoluteURI)) {
            if (isJSONPointer(fragment)) {
              const document = this.documentIndex.getDocument(absoluteURI)
              const root = evaluateJSONPointer(fragment, document)
              this.schemaIndex.addSchemasFromDocument(
                root,
                isSchema ? '' : `${locationFromNearestSchema}${fragment}`,
                document,
                absoluteURI
              )
            } else {
              this.schemaIndex.addSchemasFromDocument(
                document,
                isSchema ? '' : locationFromNearestSchema,
                document,
                absoluteURI
              )
            }
            return
          } else {
            result.set(unretrievedURI, { metaSchemaURI, locationFromNearestSchema })
          }
        })
        return result
      }
    })

    this.retrieve = this.documentIndex.retrieve
    this.defaultMetaSchemaURI = this.schemaIndex.defaultMetaSchemaURI
  }

  documentURIs() {
    return this.documentIndex.documentURIs()
  }

  infoForDocument(document: any) {
    return this.documentIndex.infoForDocument(document)
  }

  baseURIForDocument(schema: any) {
    return this.documentIndex.infoForValue(schema)?.baseURI
  }

  rootSchema() {
    return this.documentIndex.rootDocument()
  }

  baseURIForSchema(schema: any) {
    return this.schemaIndex.infoForValue(schema)?.baseURI
  }

  metaSchemaURIForSchema(schema: any) {
    return this.schemaIndex.infoForValue(schema)?.metadata.metaSchemaURI
  }

  dereferenceReference(reference: URI, schema: object, path: JSONPointer[]): object {
    const baseURI = this.baseURIForSchema(schema)
    const uri = resolveURIReference(reference, baseURI)
    return this.find(uri, { followReferences: false })
  }

  dereferenceDynamicReference(dynamicReference: URI, schema: object, path: JSONPointer[]): object {
    const baseURI = this.baseURIForSchema(schema)
    const uri = resolveURIReference(dynamicReference, baseURI)
    const dereferencedSchema = this.find(uri, { followReferences: false })

    // A $dynamicRef without anchor in fragment behaves identical to $ref
    if (isJSONPointer(splitFragment(uri).fragment)) {
      return dereferencedSchema
    }

    const root = this.rootSchema()
    let candidate = root
    for (const jsonPointer of path) {
      candidate = evaluateJSONPointer(jsonPointer, candidate)

      if (jsonPointer === '/$ref' && typeof candidate === 'string') {
        const baseURI = this.baseURIForSchema(schema)
        const uri = resolveURIReference(candidate, baseURI)
        candidate = this.find(uri, { followReferences: false })
      }

      if (typeof candidate !== 'object') {
        continue
      }

      if ('$dynamicAnchor' in candidate && candidate.$dynamicAnchor === dereferencedSchema.$dynamicAnchor) {
        return candidate
      }

      if ('$id' in candidate && typeof candidate.$id === 'string') {
        const outermostBaseURI = this.baseURIForSchema(candidate) ?? this.baseURIForSchema(root)
        const outermostURI = resolveURIReference(candidate.$id, outermostBaseURI)
        const anchorURI = resolveURIReference(`#${dereferencedSchema.$dynamicAnchor}`, outermostURI)
        const candidateAnchor = this.find(anchorURI, { followReferences: false })
        if (candidateAnchor) {
          // An $anchor with the same name as a $dynamicAnchor is not used for dynamic scope resolution
          if (
            typeof candidateAnchor === 'object' &&
            '$dynamicAnchor' in candidateAnchor &&
            candidateAnchor.$dynamicAnchor === dereferencedSchema.$dynamicAnchor
          ) {
            return candidateAnchor
          }
        }
      }
    }

    return dereferencedSchema
  }

  find(uri: URI, options?: { followReferences: boolean }) {
    return this.documentIndex.find(uri, options) // delegates to schemaIndex, move common code into this?
  }

  addRootSchema(rootSchema: object, rootSchemaURI: URI) {
    this.documentIndex.addDocument(rootSchema, rootSchemaURI, {
      metaSchemaURI: this.schemaIndex.defaultMetaSchemaURI,
      locationFromNearestSchema: ''
    })
  }
}
