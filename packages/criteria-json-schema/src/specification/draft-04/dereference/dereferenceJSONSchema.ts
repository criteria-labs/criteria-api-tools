import { Index, indexDocumentInto } from './indexDocumentInto'
import { JSONSchema, Reference } from '../JSONSchema'
import { memoize } from '../retrievers/memoize'
import { normalizeURI, resolveURIReference, URI } from '../uri'
import { cloneValues, SchemaContext, ReferenceContext } from './visitors/cloneValues'

interface Options {
  baseURI?: URI
  retrieve?: (uri: URI) => JSONSchema
}

const defaultBaseURI = ''
const defaultRetrieve = (uri: URI): JSONSchema => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}

// TODO: warn on violations of SHOULD directives
export function dereferenceJSONSchema(schema: JSONSchema, options?: Options) {
  const baseURI = normalizeURI(options?.baseURI ?? defaultBaseURI)
  const retrieve = memoize((uri: string) => {
    const document = uri === baseURI ? schema : options?.retrieve(uri) ?? defaultRetrieve(uri)
    if (!document) {
      throw new Error(`Invalid document retrieve at uri '${uri}'`)
    }
    return document
  })

  const index = new Index()
  indexDocumentInto(index, schema, baseURI, retrieve)

  // Cache of previously dereferenced values by uri
  // Multiple URIs may refer to the same value
  const dereferencedByURI: { [uri: URI]: any } = {}

  // Maintains reference equality from the source schema
  // Important when the passed in schema is already dereferenced instead of JSON
  const dereferencedBySource = new Map()

  const dereferenceSubschema = (schema: JSONSchema, context: SchemaContext) => {
    if (dereferencedBySource.has(schema)) {
      return dereferencedBySource.get(schema)
    }

    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    const result = {}
    dereferencedBySource.set(schema, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    context.cloneInto(result)
    return result
  }

  const dereferenceReference = (reference: Reference, context: ReferenceContext) => {
    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    // Keep following references until we find a concrete value
    // It was important to index all known schemas first so that we can follow all references to their conclusion
    const uri = resolveURIReference(reference.$ref, context.baseURI)
    const sourceValue = index.findValue(uri)

    if (!sourceValue) {
      throw new Error(`Invalid uri ${uri}`)
    }

    return context.clone(sourceValue.value, sourceValue.context)
  }

  const dereferenceReferenceWithSiblings = (reference: Reference, context: ReferenceContext) => {
    // Merging $ref and siblings creates a new unique object,
    // otherwise sibling properties will be applied everywhere the same $ref is used
    // Assume that siblings does not need to be further dereferenced

    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    const { $ref, ...siblings } = reference

    // Since references with siblings are treated as unique merged objects, we may still get cycles here
    // If we detect a cycle, we still have to apply sibling properties
    if (dereferencedBySource.has(reference)) {
      const result = dereferencedBySource.get(reference)
      Object.assign(result, siblings)
      context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
      return result
    }

    const result = {}
    dereferencedBySource.set(reference, result)

    const dereferenced = context.clone(
      { $ref },
      {
        baseURI: context.baseURI,
        jsonPointer: context.jsonPointer,
        resolvedURIs: [] // do not pass through since these point to a new unique merge object, not the referenced object
      }
    )

    // TODO: can we dereference siblings now?

    Object.assign(result, dereferenced, siblings)
    dereferencedBySource.set(reference, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    return result
  }

  // Actually clone the schema
  const dereferencedDocuments = {}
  for (const [uri, sourceDocument] of Object.entries(index.documentsByURI)) {
    dereferencedDocuments[uri] = cloneValues(sourceDocument.value, sourceDocument.context, (value, kind, context) => {
      if (kind === 'schema') {
        return dereferenceSubschema(value, context as SchemaContext)
      } else if (kind === 'reference') {
        if (Object.keys(value).length == 1) {
          return dereferenceReference(value, context as ReferenceContext)
        } else {
          return dereferenceReferenceWithSiblings(value, context as ReferenceContext)
        }
      } else {
        return value
      }
    })
  }

  return dereferencedDocuments[baseURI]
}
