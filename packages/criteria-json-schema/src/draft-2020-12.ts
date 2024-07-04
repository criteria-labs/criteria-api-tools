import metaSchema from './specification/draft-2020-12/meta-schema'

export * from './specification/draft-2020-12/JSONSchema'
export * from './specification/draft-2020-12/dereferenceJSONSchema'
export * from './specification/draft-2020-12/visitSubschemas'

export type MetaSchemaID = 'https://json-schema.org/draft/2020-12/schema'
export const metaSchemaID = metaSchema.$id as MetaSchemaID
