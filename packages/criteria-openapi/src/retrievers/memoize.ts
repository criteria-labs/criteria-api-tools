import { normalizeURI, URI } from '../util/uri'

export function memoize(retrieve: (uri: URI) => any): (uri: URI) => any {
  const cache: { [uri: URI]: object } = {}
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
