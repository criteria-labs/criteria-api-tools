import { JSONSchema } from '../JSONSchema'
import { URI } from '../uri'

export function retrieveUsingLookup(schemas: { [uri: URI]: JSONSchema }): (uri: URI) => JSONSchema {
  return (uri: URI) => {
    return schemas[uri]
  }
}
