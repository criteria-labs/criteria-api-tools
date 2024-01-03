import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI
} from '../../dereferencing/dereferenceJSONSchema'
import { MaybePromise } from '../../util/promises'
import { DereferencedJSONSchemaObject, JSONSchema, JSONSchemaBooleanSchema, metaSchemaURI } from './JSONSchema'

export type Dereferenced<T extends JSONSchema> = T extends JSONSchemaBooleanSchema
  ? JSONSchemaBooleanSchema
  : DereferencedJSONSchemaObject

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI' | 'retrieve'>
): Dereferenced<T>
export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<AsyncDereferenceOptions, 'defaultMetaSchemaURI'>
): Promise<Dereferenced<T>>
export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions, 'defaultMetaSchemaURI'>
): Dereferenced<T>

export function dereferenceJSONSchema<T extends JSONSchema>(
  schema: T,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultMetaSchemaURI'>
): MaybePromise<Dereferenced<T>> {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, {
    ...options,
    defaultMetaSchemaURI: metaSchemaURI
  })
}
