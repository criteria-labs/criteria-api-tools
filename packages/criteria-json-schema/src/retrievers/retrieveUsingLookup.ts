import { URI } from '../util/uri'

export function retrieveUsingLookup(schemas: { [uri: URI]: any }): (uri: URI) => any {
  return (uri: URI) => {
    return schemas[uri]
  }
}
