import baseDialectJSON from './dialect/base.json'
import baseVocabularyJSON from './meta/base.json'

export default baseDialectJSON

const schemas = [baseDialectJSON, baseVocabularyJSON]

export const schemasByID = Object.fromEntries(schemas.map((schema) => [schema.$id, schema]))
