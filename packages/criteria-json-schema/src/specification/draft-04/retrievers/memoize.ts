import { JSONSchema } from '../JSONSchema'
import { normalizeURI, URI } from '../uri'

export function memoize(retrieve: (uri: URI) => JSONSchema): (uri: URI) => JSONSchema {
  const cache: { [uri: URI]: JSONSchema } = {}
  return (uri: URI) => {
    const normalizedURI = normalizeURI(uri)
    const cached = cache[normalizedURI]
    if (cached) {
      return cached
    }
    const document = retrieve(uri)
    cache[normalizedURI] = document
    return document
  }
}
