import metaSchema from './specification/draft-04/meta-schema'

export * from './specification/draft-04/JSONSchema'
export * from './specification/draft-04/dereferenceJSONSchema'
export * from './specification/draft-04/visitSubschemas'

export type MetaSchemaID = 'http://json-schema.org/draft-04/schema#'
export const metaSchemaID = metaSchema.id as MetaSchemaID
