import {
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI
} from '../../dereferencing/dereferenceJSONSchema'
import { DereferencedJSONSchema, JSONSchema, metaSchemaURI } from './JSONSchema'

export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI'>
): DereferencedJSONSchema {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, {
    ...options,
    defaultMetaSchemaURI: metaSchemaURI
  })
}
