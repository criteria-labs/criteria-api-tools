import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI
} from '../../dereferencing/dereferenceJSONSchema'
import { MaybePromise } from '../../util/promises'
import { DereferencedJSONSchema, JSONSchema, metaSchemaURI } from './JSONSchema'

export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI' | 'retrieve'>
): DereferencedJSONSchema
export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<AsyncDereferenceOptions, 'defaultMetaSchemaURI'>
): Promise<DereferencedJSONSchema>
export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI'>
): DereferencedJSONSchema

export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultMetaSchemaURI'>
): MaybePromise<DereferencedJSONSchema> {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, {
    ...options,
    defaultMetaSchemaURI: metaSchemaURI
  })
}
