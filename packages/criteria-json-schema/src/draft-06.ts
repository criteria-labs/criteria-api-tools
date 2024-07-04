import metaSchema from './specification/draft-06/meta-schema'

export * from './specification/draft-06/JSONSchema'
export * from './specification/draft-06/dereferenceJSONSchema'
export * from './specification/draft-06/visitSubschemas'

export type MetaSchemaID = 'http://json-schema.org/draft-06/schema#'
export const metaSchemaID = metaSchema.$id as MetaSchemaID
