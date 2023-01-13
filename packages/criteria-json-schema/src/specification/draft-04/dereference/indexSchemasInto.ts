import { JSONSchema, Reference } from '../JSONSchema'
import { resolveURIReference, splitFragment, URI } from '../uri'
import { Context } from './visitors/context'
import { visitValues } from './visitors/visitValues'

export function indexSchemasInto(
  schemasByURI: { [uri: URI]: { value: JSONSchema; context: Context } },
  rootSchema: JSONSchema,
  baseURI: URI,
  retrieve: (uri: URI) => JSONSchema
) {
  // Collect external URIs to retrieve
  var unretrievedURIs = new Set<URI>()
  visitValues(rootSchema, { baseURI, jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
    if (kind === 'schema') {
      context.resolvedURIs.forEach((uri) => (schemasByURI[uri] = { value, context: { ...context } }))
    } else if (kind === 'reference') {
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
