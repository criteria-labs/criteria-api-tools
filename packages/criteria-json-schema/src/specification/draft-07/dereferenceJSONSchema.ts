import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI
} from '../../dereferencing/dereferenceJSONSchema'
import { MaybePromise } from '../../util/promises'
import { DereferencedJSONSchema, JSONSchema } from './JSONSchema'
import metaSchema from './meta-schema'

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
    defaultMetaSchemaURI: metaSchema.$id
  })
}
