import { JSONSchema, Reference } from '../JSONSchema'
import { hasFragment, resolveURIReference, splitFragment, URI } from '../uri'
import { Context } from './visitors/context'
import { visitValues } from './visitors/visitValues'

export function indexSchemasInto(
  schemasByURI: { [uri: URI]: { value: JSONSchema; context: Context } },
  rootSchema: JSONSchema,
  baseURI: URI,
  retrieve: (uri: URI) => JSONSchema
) {
  // Also index the root schema by the base URI (retrieval URI) if it contains an id
  if ('id' in rootSchema) {
    schemasByURI[baseURI] = {
      value: rootSchema,
      context: { baseURI: baseURI, jsonPointer: '', resolvedURIs: [baseURI] }
    }
  }

  // Collect external URIs to retrieve
  var unretrievedURIs = new Set<URI>()
  visitValues(rootSchema, { baseURI, jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
    if (kind === 'schema') {
      context.resolvedURIs.forEach((uri) => (schemasByURI[uri] = { value, context: { ...context } }))
    } else if (kind === 'reference') {
      if (!hasFragment(context.baseURI) && context.jsonPointer === '') {
        // root is a reference
        context.resolvedURIs.forEach((uri) => (schemasByURI[uri] = { value, context: { ...context } }))
      }

      let uri = resolveURIReference((value as Reference).$ref, context.baseURI)

      const { absoluteURI } = splitFragment(uri)
      let indexEntry = schemasByURI[absoluteURI] // might return the original root
      if (!indexEntry) {
        // Don't retrieve yet, because it may resolve to a nested schema with an id
        unretrievedURIs.add(absoluteURI)
      }
    }
  })

  // Retrieve documents from URIs
  for (const uri of unretrievedURIs) {
    if (schemasByURI[uri]) {
      continue
    }
    let document
    try {
      document = retrieve(uri)
    } catch (error) {
      throw new Error(`Failed to retrieve document at uri '${uri}'`)
    }

    indexSchemasInto(schemasByURI, document, uri, retrieve)
  }
}
