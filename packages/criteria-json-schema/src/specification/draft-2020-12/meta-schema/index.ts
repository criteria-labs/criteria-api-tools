import applicatorSchemaJSON from './meta/applicator.json'
import contentSchemaJSON from './meta/content.json'
import coreSchemaJSON from './meta/core.json'
import formatAnnotationJSON from './meta/format-annotation.json'
import formatAssertionJSON from './meta/format-assertion.json'
import metaDataSchemaJSON from './meta/meta-data.json'
import unevaluatedSchemaJSON from './meta/unevaluated.json'
import validationSchemaJSON from './meta/validation.json'
import schemaJSON from './schema.json'

export default schemaJSON

const schemas = [
  schemaJSON,
  coreSchemaJSON,
  applicatorSchemaJSON,
  validationSchemaJSON,
  unevaluatedSchemaJSON,
  formatAnnotationJSON,
  formatAssertionJSON,
  contentSchemaJSON,
  metaDataSchemaJSON
]

export const schemasByID = Object.fromEntries(schemas.map((schema) => [schema.$id, schema]))
