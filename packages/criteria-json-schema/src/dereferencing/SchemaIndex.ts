import { escapeReferenceToken, evaluateJSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '../draft-2020-12'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { visitSubschemas as visitSubschemasDraft2020_12 } from '../specification/draft-2020-12/visitSubschemas'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference, splitFragment } from '../util/uri'

function isReference(value: any): value is { $ref: string } {
  return typeof value === 'object' && '$ref' in value && Object.keys(value).length === 1
}

interface SchemaContext {
  baseURI: URI
  metaSchemaURI: URI
}

export type Retrieve = (uri: URI) => any

export class SchemaIndex {
  private documentsByURI = new Map<string, any>()
  private contextsByDocument = new Map<object, SchemaContext>()
  private schemasByURI = new Map<string, object>()
  private schemasByAnchors = new Map<string, object>()
  private schemasByDynamicAnchors = new Map<string, object>()
  private contextsBySchema = new Map<object, SchemaContext>()
  constructor() {}

  documentURIs() {
    return this.documentsByURI.keys()
  }

  find(uri: URI, options?: { followReferences: boolean; _uris?: Set<URI> }): any {
    const _uris = options?._uris ?? new Set()
    _uris.add(uri)

    const followReference = (value: any, baseURI: URI) => {
      if (isReference(value)) {
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

    let schema = this.schemasByURI.get(uri)
    if (schema !== undefined) {
      return options?.followReferences === true
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    schema = this.schemasByAnchors.get(uri)
    if (schema !== undefined) {
      return options?.followReferences === true
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    schema = this.schemasByDynamicAnchors.get(uri)
    if (schema !== undefined) {
      return options?.followReferences === true
        ? followReference(schema, this.contextsBySchema.get(schema).baseURI)
        : schema
    }

    const document = this.documentsByURI.get(uri)
    if (document !== undefined) {
      return options?.followReferences === true && typeof document !== 'boolean'
        ? followReference(document, this.contextsByDocument.get(document).baseURI)
        : document
    }

    const { absoluteURI, fragment } = splitFragment(uri)
    if (absoluteURI !== uri && isJSONPointer(fragment)) {
      const container = this.find(absoluteURI, options)
      const evaluatedValue = evaluateJSONPointer(fragment, container)
      if (evaluatedValue !== undefined) {
        const containerBaseURI = this.contextsBySchema.has(container)
          ? this.contextsBySchema.get(container).baseURI
          : this.contextsByDocument.has(container)
          ? this.contextsByDocument.get(container).baseURI
          : absoluteURI

        return options?.followReferences === true ? followReference(evaluatedValue, containerBaseURI) : evaluatedValue
      }

      if (options?.followReferences === true) {
        if (fragment === '') {
          return container
        }

        const i = uri.lastIndexOf('/')
        const parentURI = uri.slice(0, i) as JSONPointer
        const remainingFragment = uri.slice(i)

        let parent = this.find(parentURI, options)
        const evaluatedValue = evaluateJSONPointer(remainingFragment, parent) // try evaluating against siblings of $ref
        const parentBaseURI = this.contextsBySchema.has(parent)
          ? this.contextsBySchema.get(parent).baseURI
          : this.contextsByDocument.has(parent)
          ? this.contextsByDocument.get(parent).baseURI
          : absoluteURI // or containerBaseURI?
        if (evaluatedValue !== undefined) {
          return options?.followReferences === true ? followReference(evaluatedValue, parentBaseURI) : evaluatedValue
        }

        if (typeof parent === 'object' && '$ref' in parent && typeof parent.$ref === 'string') {
          const parentRefURI = resolveURIReference(parent.$ref, parentBaseURI)
          parent = this.find(parentRefURI, options)

          const evaluatedValue = evaluateJSONPointer(remainingFragment, parent)

          if (evaluatedValue !== undefined) {
            const parentBaseURI = this.contextsBySchema.has(parent)
              ? this.contextsBySchema.get(parent).baseURI
              : this.contextsByDocument.has(parent)
              ? this.contextsByDocument.get(parent).baseURI
              : absoluteURI // or containerBaseURI?
            return options?.followReferences === true ? followReference(evaluatedValue, parentBaseURI) : evaluatedValue
          }
        }
      }
    }

    return undefined
  }

  baseURIForSchema(schema: object): URI {
    return this.contextsBySchema.get(schema)?.baseURI
  }

  metaSchemaURIForSchema(schema: object): URI {
    return this.contextsBySchema.get(schema)?.metaSchemaURI
  }

  dynamicScopeForPath(path: JSONPointer, root: JSONSchema): JSONSchema[] {
    if (path === '') {
      return [root]
    }
    const referenceTokens = path.split('/')
    for (const referenceToken of referenceTokens) {
    }
  }

  addDocument(
    document: object,
    documentURI: URI,
    isSubschema: (location: JSONPointer) => boolean,
    { cloned, retrieve, defaultMetaSchemaURI }: { cloned: boolean; retrieve: Retrieve; defaultMetaSchemaURI: URI }
  ) {
    const visitSubschemas = (metaSchemaURI: string) => {
      switch (metaSchemaURI) {
        case 'https://json-schema.org/draft/2020-12/schema':
          return visitSubschemasDraft2020_12
        case 'http://json-schema.org/draft-04/schema#':
          return visitSubschemasDraft04
        default:
          return visitSubschemas(defaultMetaSchemaURI)
      }
    }

    if (cloned) {
      document = structuredClone(document)
    }

    this.documentsByURI.set(documentURI, document)
    if (typeof document === 'object') {
      this.contextsByDocument.set(document, { baseURI: documentURI, metaSchemaURI: defaultMetaSchemaURI })
    }

    const contextForLocation = (location: JSONPointer): SchemaContext | undefined => {
      const subschema = evaluateJSONPointer(location, document)
      if (subschema && this.contextsBySchema.has(subschema)) {
        return this.contextsBySchema.get(subschema)
      }

      if (location === '') {
        if (this.contextsByDocument.has(document)) {
          return this.contextsByDocument.get(document)
        }
        return undefined
      }
      const i = location.lastIndexOf('/')
      const parentLocation = location.slice(0, i) as JSONPointer
      return contextForLocation(parentLocation)
    }

    let unretrievedURIs = new Map<URI, (location: JSONPointer) => boolean>()

    visitSubschemas(defaultMetaSchemaURI)(document, isSubschema, (subschema, path) => {
      if (typeof subschema === 'boolean') {
        return
      }

      const { baseURI, metaSchemaURI } = contextForLocation(path.join('') as JSONPointer) ?? {
        baseURI: documentURI,
        metaSchemaURI: defaultMetaSchemaURI
      }

      const $schema = '$schema' in subschema ? subschema.$schema : metaSchemaURI

      let $id: string | undefined
      switch ($schema) {
        case 'https://json-schema.org/draft/2020-12/schema': {
          if ('$id' in subschema && typeof subschema.$id === 'string') {
            // TODO?: do absolute and # fragemnt versions?
            $id = resolveURIReference(subschema.$id, baseURI)
            this.schemasByURI.set($id, subschema)
          }
          break
        }
        case 'http://json-schema.org/draft-04/schema#': {
          if ('id' in subschema && typeof subschema.id === 'string') {
            // TODO?: do absolute and # fragemnt versions?
            $id = resolveURIReference(subschema.id, baseURI)
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
        const $ref = resolveURIReference(subschema.$ref, baseURI)
        // Don't retrieve yet, because it may resolve to a nested schema with an id
        unretrievedURIs.set(splitFragment($ref).absoluteURI, (location) => location === '')
      }

      if ('$dynamicRef' in subschema && typeof subschema.$dynamicRef === 'string') {
        const $dynamicRef = resolveURIReference(subschema.$dynamicRef, baseURI)
        // Don't retrieve yet, because it may resolve to a nested schema with an id
        unretrievedURIs.set(splitFragment($dynamicRef).absoluteURI, (location) => location === '')
      }
    })

    // technically shouldn't need this, but used for non-standard $refs
    visitRefs(document, (ref, location) => {
      const { baseURI, metaSchemaURI } = contextForLocation(location) ?? {
        baseURI: documentURI,
        metaSchemaURI: defaultMetaSchemaURI
      }
      const uri = resolveURIReference(ref, baseURI)
      unretrievedURIs.set(splitFragment(uri).absoluteURI, (location) => location === '')
    })

    unretrievedURIs.forEach((isSubschema, uri) => {
      if (this.documentsByURI.has(uri)) {
        return
      }
      if (this.schemasByURI.has(uri)) {
        return
      }
      if (this.schemasByAnchors.has(uri)) {
        return
      }
      if (this.schemasByDynamicAnchors.has(uri)) {
        return
      }

      let externalDocument
      try {
        externalDocument = retrieve(uri)
      } catch (error) {
        throw new Error(`Failed to retrieve document at uri '${uri}'`)
      }

      this.addDocument(externalDocument, uri, isSubschema, { cloned, retrieve, defaultMetaSchemaURI })
    })
  }
}

function visitRefs(document: JSONSchema, visitor: (ref: string, location: JSONPointer) => boolean | void) {
  // detects circular references
  const seen = new WeakSet()

  const visitObject = (object: object, location: JSONPointer) => {
    if (seen.has(object)) {
      return false
    }
    seen.add(object)

    if ('$ref' in object && typeof object['$ref'] === 'string' && Object.keys(object).length === 1) {
      return visitor(object['$ref'], location)
    }

    for (const [key, value] of Object.entries(object)) {
      const stop = Boolean(visitValue(value, `${location}/${escapeReferenceToken(key)}`))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitArray = (array: any[], location: JSONPointer) => {
    for (let index = 0; index < array.length; index++) {
      const stop = Boolean(visitValue(array[index], `${location}/${index}`))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitValue = (value: any, location: JSONPointer): boolean => {
    if (typeof value === 'boolean') {
      return false
    }

    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      if (Array.isArray(value)) {
        visitArray(value, location)
      } else {
        visitObject(value, location)
      }
    }
  }

  visitValue(document, '')
}
