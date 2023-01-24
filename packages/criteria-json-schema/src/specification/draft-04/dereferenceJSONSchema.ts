import { dereferenceJSONSchema as dereferenceJSONSchemaWithConfiguration } from '../../dereferencing/dereferenceJSONSchema'
import { URI } from '../../util/uri'
import { DereferencedJSONSchema, JSONSchema } from './JSONSchema'
import visitorConfiguration from './visitorConfiguration'

interface Options {
  baseURI?: URI
  retrieve?: (uri: URI) => JSONSchema
}

export function dereferenceJSONSchema(schema: JSONSchema, options?: Options): DereferencedJSONSchema {
  return dereferenceJSONSchemaWithConfiguration(schema, { ...options, defaultConfiguration: visitorConfiguration })
}
