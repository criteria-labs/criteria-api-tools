import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaID
} from '../../dereferencing/dereferenceJSONSchema'
import { MaybePromise } from '../../util/promises'
import { DereferencedJSONSchemaObject, JSONSchema, JSONSchemaBooleanSchema } from './JSONSchema'
import metaSchema from './meta-schema'

export type Dereferenced<T extends JSONSchema> = T extends JSONSchemaBooleanSchema
  ? JSONSchemaBooleanSchema
  : DereferencedJSONSchemaObject

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaID' | 'retrieve'>
): Dereferenced<T>
export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<AsyncDereferenceOptions, 'defaultMetaSchemaID'>
): Promise<Dereferenced<T>>
export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaID'>
): Dereferenced<T>

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultMetaSchemaID'>
): MaybePromise<Dereferenced<T>> {
  return dereferenceJSONSchemaWithDefaultMetaSchemaID(schema, {
    ...options,
    defaultMetaSchemaID: metaSchema.$id
  })
}
