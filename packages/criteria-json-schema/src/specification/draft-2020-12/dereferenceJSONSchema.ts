import { dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI } from '../../dereferencing/dereferenceJSONSchema'
import { URI } from '../../util/uri'
import { DereferencedJSONSchemaObject, JSONSchema, JSONSchemaBooleanSchema } from './JSONSchema'
import { ReferenceMergePolicy } from './mergeReferenceInto'
import { metaSchemaURI } from './metaSchemaURI'

export interface Options {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
  retrieve?: (uri: URI) => JSONSchema
}

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Options
): T extends JSONSchemaBooleanSchema ? JSONSchemaBooleanSchema : DereferencedJSONSchemaObject {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}
