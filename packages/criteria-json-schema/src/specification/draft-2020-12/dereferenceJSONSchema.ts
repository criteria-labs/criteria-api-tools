import {
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI
} from '../../dereferencing/dereferenceJSONSchema'
import { DereferencedJSONSchemaObject, JSONSchema, JSONSchemaBooleanSchema, metaSchemaURI } from './JSONSchema'

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI'>
): T extends JSONSchemaBooleanSchema ? JSONSchemaBooleanSchema : DereferencedJSONSchemaObject {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, { ...options, defaultMetaSchemaURI: metaSchemaURI })
}
