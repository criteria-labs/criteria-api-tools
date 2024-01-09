import schemaJSON from './schema.json'

export default schemaJSON

const schemas = [schemaJSON]

export const schemasByID = Object.fromEntries(schemas.map((schema) => [schema.$id, schema]))
