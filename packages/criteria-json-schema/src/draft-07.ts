import metaSchema from './specification/draft-07/meta-schema'

export * from './specification/draft-07/JSONSchema'
export * from './specification/draft-07/dereferenceJSONSchema'
export * from './specification/draft-07/visitSubschemas'

export type MetaSchemaID = 'http://json-schema.org/draft-07/schema#'
export const metaSchemaID = metaSchema.$id as MetaSchemaID
