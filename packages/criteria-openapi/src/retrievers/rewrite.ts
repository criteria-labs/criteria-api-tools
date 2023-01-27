import { URI } from '../util/uri'

export function rewrite(map: { [source: URI]: URI }, retrieve: (uri: URI) => any): (uri: URI) => any {
  return (uri: URI) => {
    let mappedURI = uri
    for (const source in map) {
      if (uri.startsWith(source)) {
        mappedURI = uri.replaceAll(source, map[source])
        break
      }
    }
    return retrieve(mappedURI)
  }
}
