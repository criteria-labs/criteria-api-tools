import { evaluateJSONPointer } from '@criteria/json-pointer'
import { memoize, retrieveBuiltin } from '../retrievers'
import { resolveID as resolveIDDraft04 } from '../specification/draft-04/resolveID'
import {
  isSubschema as isSubschemaDraft04,
  visitSubschemas as visitSubschemasDraft04
} from '../specification/draft-04/visitSubschemas'
import { metaSchemaURI as metaSchemaURIDraft2020_12 } from '../specification/draft-2020-12/metaSchemaURI'
import { resolveID as resolveIDDraft2020_12 } from '../specification/draft-2020-12/resolveID'
import {
  isSubschema as isSubschemaDraft2020_12,
  visitSubschemas as visitSubschemasDraft2020_12
} from '../specification/draft-2020-12/visitSubschemas'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference, splitFragment } from '../util/uri'
import { isJSONReference, visitJSONReferences } from '../util/visitJSONReferences'

// default configuration
export const defaultCloned = false
const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}
const defaultDefaultMetaSchemaURI = metaSchemaURIDraft2020_12 // yes, defaultDefault...

export interface SchemaIndexInfo {
  baseURI: URI
  metaSchemaURI: URI
}

export interface DocumentIndexInfo {
  baseURI: URI
  metaSchemaURI: URI
  locationFromNearestSchema: JSONPointer
}

export interface SchemaIndexConfiguration {
  cloned?: boolean
  retrieve?: (uri: URI) => any
  defaultMetaSchemaURI: URI
}

export class SchemaIndex {
  readonly cloned: boolean
  readonly retrieve: (uri: URI) => any
  readonly defaultMetaSchemaURI: URI
  constructor(configuration: SchemaIndexConfiguration) {
    this.cloned = configuration.cloned ?? defaultCloned
    this.retrieve = memoize((uri: string) => {
      const document = retrieveBuiltin(uri) ?? configuration?.retrieve(uri) ?? defaultRetrieve(uri)
      if (!document) {
        throw new Error(`Invalid document retrieved at uri '${uri}'`)
      }
      return document
    })
    this.defaultMetaSchemaURI = configuration?.defaultMetaSchemaURI ?? defaultDefaultMetaSchemaURI
  }

  // Indexes documents
  private documentsByURI = new Map<string, any>()
  private contextsByDocument = new Map<object, DocumentIndexInfo>()

  // Indexes schemas and { $ref }
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private contextsBySchema = new Map<object, SchemaIndexInfo>()

  // Indexes { $ref } in locations that are not schemas
  private contextsByJSONReference = new Map<object, SchemaIndexInfo>()

  rootDocument() {
    for (const document of this.documentsByURI.values()) {
      return document
    }
    return undefined
  }

  documentURIs() {
    return this.documentsByURI.keys()
  }

  infoForDocument(document: any): DocumentIndexInfo {
    return this.contextsByDocument.get(document)
  }

  infoForValue(value: any) {
    if (this.contextsBySchema.has(value)) {
      return this.contextsBySchema.get(value)
    }
    if (this.contextsByDocument.has(value)) {
      return this.contextsByDocument.get(value)
    }
    if (this.contextsByJSONReference.has(value)) {
      return this.contextsByJSONReference.get(value)
    }
    return undefined
  }

  baseURIForSchema(schema: object): URI {
    return this.contextsBySchema.get(schema)?.baseURI
  }

  baseURIForDocument(document: object): URI {
    return this.contextsByDocument.get(document)?.baseURI
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

    const root = this.rootDocument()
    let candidate = root
    for (const jsonPointer of path) {
      candidate = evaluateJSONPointer(jsonPointer, candidate)

      if (jsonPointer === '/$ref') {
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

      if ('$id' in candidate) {
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

    let schema = this.schemasByURI.get(uri)
    if (schema !== undefined) {
      return followReferences && typeof schema === 'object'
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    schema = this.schemasByAnchors.get(uri)
    if (schema !== undefined) {
      return followReferences && typeof schema === 'object'
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    schema = this.schemasByDynamicAnchors.get(uri)
    if (schema !== undefined) {
      return followReferences && typeof schema === 'object'
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    const document = this.documentsByURI.get(uri)
    if (document !== undefined) {
      return followReferences && typeof document === 'object'
        ? followReference(document, this.contextsByDocument.get(document).baseURI)
        : document
    }

    const { absoluteURI, fragment } = splitFragment(uri)
    if (absoluteURI !== uri && isJSONPointer(fragment)) {
      const container = this.find(absoluteURI, options)
      const evaluatedValue = evaluateJSONPointer(fragment, container)
      if (evaluatedValue !== undefined) {
        const baseURI = this.infoForValue(container)?.baseURI
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
          const info = this.infoForValue(parent)
          return options?.followReferences === true ? followReference(evaluatedValue, info?.baseURI) : evaluatedValue
        }

        if (typeof parent === 'object' && '$ref' in parent) {
          if (typeof parent.$ref == 'object') {
            parent = parent.$ref
          } else {
            const info = this.infoForValue(parent)
            const parentRefURI = resolveURIReference(parent.$ref, info.baseURI)
            parent = this.find(parentRefURI, options)
          }

          const evaluatedValue = evaluateJSONPointer(remainingFragment, parent)

          if (evaluatedValue !== undefined) {
            const info = this.infoForValue(parent)
            return options?.followReferences === true ? followReference(evaluatedValue, info?.baseURI) : evaluatedValue
          }
        }
      }
    }

    return undefined
  }

  addDocument(
    document: object,
    documentURI: URI,
    rootSchemaLocation: JSONPointer,
    locationFromNearestSchema: JSONPointer
  ) {
    if (documentURI !== splitFragment(documentURI).absoluteURI) {
      throw new Error('Document URI must be absolute')
    }

    if (this.cloned) {
      document = structuredClone(document)
    }

    this.documentsByURI.set(documentURI, document)
    if (typeof document === 'object') {
      this.contextsByDocument.set(document, {
        baseURI: documentURI,
        metaSchemaURI: this.defaultMetaSchemaURI,
        locationFromNearestSchema
      })
    }

    const rootSchema = evaluateJSONPointer(rootSchemaLocation, document)
    this.addSchemas(rootSchema, locationFromNearestSchema, document, documentURI)
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

    const isSubschema = (metaSchemaURI: string) => {
      switch (metaSchemaURI) {
        case 'https://json-schema.org/draft/2020-12/schema':
          return isSubschemaDraft2020_12
        case 'http://json-schema.org/draft-04/schema#':
          return isSubschemaDraft04
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
      if (this.contextsByDocument.has(reference)) {
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

      references.set(uri, { isSchema: false, location: `${locationFromNearestSchema}${location}` })
    })

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
      if (this.documentsByURI.has(reference)) {
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
      if (this.documentsByURI.has(absoluteURI)) {
        if (isJSONPointer(fragment)) {
          const document = this.documentsByURI.get(absoluteURI)
          const root = evaluateJSONPointer(fragment, document)
          this.addSchemas(root, isSchema ? '' : `${locationFromNearestSchema}${fragment}`, document, absoluteURI)
        } else {
          this.addSchemas(document, isSchema ? '' : locationFromNearestSchema, document, absoluteURI)
        }
        return
      }

      let externalDocument
      try {
        externalDocument = this.retrieve(absoluteURI)
      } catch (error) {
        throw new Error(`Failed to retrieve document at uri '${absoluteURI}'`)
      }

      if (fragment && isJSONPointer(fragment)) {
        this.addDocument(externalDocument, absoluteURI, fragment, location)
      } else {
        this.addDocument(externalDocument, absoluteURI, '', location)
      }
    })
  }
}
