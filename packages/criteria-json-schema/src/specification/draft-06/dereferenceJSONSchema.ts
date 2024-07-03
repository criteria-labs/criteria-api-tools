import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaID
} from '../../dereferencing/dereferenceJSONSchema'
import { MaybePromise } from '../../util/promises'
import { DereferencedJSONSchema, JSONSchema } from './JSONSchema'
import metaSchema from './meta-schema'

export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaID' | 'retrieve'>
): DereferencedJSONSchema
export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<AsyncDereferenceOptions, 'defaultMetaSchemaID'>
): Promise<DereferencedJSONSchema>
export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaID'>
): DereferencedJSONSchema

export function dereferenceJSONSchema(
  schema: JSONSchema,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultMetaSchemaID'>
): MaybePromise<DereferencedJSONSchema> {
  return dereferenceJSONSchemaWithDefaultMetaSchemaID(schema, {
    ...options,
    defaultMetaSchemaID: metaSchema.$id
  })
}
