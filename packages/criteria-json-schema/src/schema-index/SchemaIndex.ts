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

export interface SchemaIndexInfo {
  baseURI: URI
  metaSchemaURI: URI
}

export interface DocumentMetadata {
  metaSchemaURI: URI
  locationFromNearestSchema: JSONPointer
}

export interface SchemaIndexConfiguration {
  cloned?: boolean
  retrieve?: (uri: URI) => any
  defaultMetaSchemaURI: URI
}

export class SchemaIndex {
  readonly defaultMetaSchemaURI: URI
  constructor(configuration: SchemaIndexConfiguration) {
    this.defaultMetaSchemaURI = configuration?.defaultMetaSchemaURI ?? defaultDefaultMetaSchemaURI

    this.documentIndex = new DocumentIndex<DocumentMetadata>({
      cloned: configuration.cloned,
      retrieve: configuration.retrieve,
      findWithURI: (uri: URI) => {
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
      },
      baseURIForValue: (value: any) => {
        if (this.contextsBySchema.has(value)) {
          return this.contextsBySchema.get(value).baseURI
        }
        if (this.contextsByJSONReference.has(value)) {
          return this.contextsByJSONReference.get(value).baseURI
        }
        return undefined
      },
      onDocumentAdded: (document, documentURI, documentMetadata) => {
        const { fragment } = splitFragment(documentURI)
        const rootSchema = fragment && isJSONPointer(fragment) ? evaluateJSONPointer(fragment, document) : document
        return this.addSchemas(rootSchema, documentMetadata.locationFromNearestSchema, document, documentURI)
      }
    })
  }

  retrieve() {
    return this.documentIndex.retrieve
  }

  // Indexes documents
  private documentIndex: DocumentIndex<DocumentMetadata>

  // Indexes schemas and { $ref }
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private contextsBySchema = new Map<object, SchemaIndexInfo>()

  // Indexes { $ref } in locations that are not schemas
  private contextsByJSONReference = new Map<object, SchemaIndexInfo>()

  rootSchema() {
    return this.documentIndex.rootDocument()
  }

  documentURIs() {
    return this.documentIndex.documentURIs()
  }

  infoForDocument(document: any) {
    return this.documentIndex.infoForDocument(document)
  }

  baseURIForDocument(document: any): URI {
    return this.infoForDocument(document)?.baseURI
  }

  infoForValue(value: any) {
    if (this.contextsBySchema.has(value)) {
      return this.contextsBySchema.get(value)
    }
    if (this.documentIndex.hasDocument(value)) {
      const documentInfo = this.documentIndex.infoForDocument(value)
      return {
        baseURI: documentInfo.baseURI,
        metaSchemaURI: documentInfo.metadata.metaSchemaURI
      }
    }
    if (this.contextsByJSONReference.has(value)) {
      return this.contextsByJSONReference.get(value)
    }
    return undefined
  }

  baseURIForSchema(schema: object): URI {
    return this.contextsBySchema.get(schema)?.baseURI
  }

  baseURIForJSONReference(jsonReference: object): URI {
    return this.contextsByJSONReference.get(jsonReference)?.baseURI
  }

  metaSchemaURIForSchema(schema: object): URI {
    return this.contextsBySchema.get(schema)?.metaSchemaURI
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

  findInfo(value: any, document: any, location: JSONPointer | null) {
    const info = this.infoForValue(value)
    if (info) {
      return info
    }

    if (!location || !isJSONPointer(location)) {
      return undefined
    }

    const i = location.lastIndexOf('/')
    const parentLocation = location.slice(0, i) as JSONPointer
    const parentValue = evaluateJSONPointer(parentLocation, document)
    return this.findInfo(parentValue, document, parentLocation)
  }

  find(uri: URI, options?: { followReferences: boolean; _uris?: Set<URI> }): any {
    return this.documentIndex.find(uri, options)
  }

  addRootSchema(document: object, documentURI: URI) {
    this.documentIndex.addDocument(document, documentURI, {
      metaSchemaURI: this.defaultMetaSchemaURI,
      locationFromNearestSchema: ''
    })
  }

  addSchemas(root: object, locationFromNearestSchema: JSONPointer, document: any, documentURI: URI) {
    let references = new Map<URI, { isSchema: boolean; location: JSONPointer }>()

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

    visitSubschemas(this.defaultMetaSchemaURI)(root, locationFromNearestSchema, (subschema, path) => {
      if (typeof subschema === 'boolean') {
        return
      }

      if (this.contextsBySchema.has(subschema)) {
        return
      }

      const { baseURI, metaSchemaURI } = this.findInfo(subschema, document, path.join('')) ?? {
        baseURI: documentURI,
        metaSchemaURI: this.defaultMetaSchemaURI
      }

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

      this.contextsBySchema.set(subschema, { baseURI: $id ?? baseURI, metaSchemaURI: $schema })

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
        references.set($ref, { isSchema: true, location: '' })
      }

      if ('$dynamicRef' in subschema && typeof subschema.$dynamicRef === 'string') {
        const $dynamicRef = resolveURIReference(subschema.$dynamicRef, $id ?? baseURI)
        // Don't retrieve yet, because it may resolve to a nested schema with an id
        references.set($dynamicRef, { isSchema: true, location: '' })
      }
    })

    // technically shouldn't need this, but used for non-standard $refs
    visitJSONReferences(document, (reference, location) => {
      if (this.documentIndex.hasDocument(reference)) {
        return
      }
      if (this.contextsBySchema.has(reference)) {
        return
      }
      if (this.contextsByJSONReference.has(reference)) {
        return
      }

      const { baseURI, metaSchemaURI } = this.findInfo(reference, document, location) ?? {
        baseURI: documentURI,
        metaSchemaURI: this.defaultMetaSchemaURI
      }

      this.contextsByJSONReference.set(reference, { baseURI, metaSchemaURI })

      const uri = resolveURIReference(reference.$ref, baseURI)
      if (references.has(uri)) {
        return
      }

      references.set(uri, {
        isSchema: false,
        location: `${locationFromNearestSchema}${location}`
      })
    })

    let unretrievedURIs = new Map<URI, DocumentMetadata>()
    references.forEach(({ isSchema, location }, reference) => {
      if (this.schemasByURI.has(reference)) {
        return
      }
      if (this.schemasByAnchors.has(reference)) {
        return
      }
      if (this.schemasByDynamicAnchors.has(reference)) {
        return
      }
      if (this.documentIndex.hasDocumentWithURI(reference)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(reference)
      if (this.schemasByURI.has(absoluteURI)) {
        return
      }
      if (this.schemasByAnchors.has(absoluteURI)) {
        return
      }
      if (this.schemasByDynamicAnchors.has(absoluteURI)) {
        return
      }
      if (this.documentIndex.hasDocumentWithURI(absoluteURI)) {
        if (isJSONPointer(fragment)) {
          const document = this.documentIndex.getDocument(absoluteURI)
          const root = evaluateJSONPointer(fragment, document)
          this.addSchemas(root, isSchema ? '' : `${locationFromNearestSchema}${fragment}`, document, absoluteURI)
        } else {
          this.addSchemas(document, isSchema ? '' : locationFromNearestSchema, document, absoluteURI)
        }
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
