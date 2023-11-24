import { dereferenceJSONSchema as dereferenceJSONSchemaWithDefaultMetaSchemaURI } from '../../dereferencing/dereferenceJSONSchema'
import { URI } from '../../util/uri'
import { DereferencedJSONSchema, JSONSchema } from './JSONSchema'
import { ReferenceMergePolicy } from './mergeReferenceInto'
import { metaSchemaURI } from './metaSchemaURI'

export interface Options {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
  retrieve?: (uri: URI) => JSONSchema
}

export function dereferenceJSONSchema(schema: JSONSchema, options?: Options): DereferencedJSONSchema {
  return dereferenceJSONSchemaWithDefaultMetaSchemaURI(schema, {
    ...options,
    defaultMetaSchemaURI: metaSchemaURI
  })
}
