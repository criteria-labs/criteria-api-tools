import { dereferenceJSONSchema as dereferenceJSONSchemaWithConfiguration } from '../../dereferencing/dereferenceJSONSchema'
import { URI } from '../../util/uri'
import { ReferenceMergePolicy } from '../../visitors/visitValues'
import { DereferencedJSONSchemaObject, JSONSchema, JSONSchemaBooleanSchema } from './JSONSchema'
import visitorConfiguration from './visitorConfiguration'

interface Options {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
  retrieve?: (uri: URI) => JSONSchema
}

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Options
): T extends JSONSchemaBooleanSchema ? JSONSchemaBooleanSchema : DereferencedJSONSchemaObject {
  return dereferenceJSONSchemaWithConfiguration(schema, { ...options, defaultConfiguration: visitorConfiguration })
}
