import { JSONSchemaDraft04, JSONSchemaDraft06, JSONSchemaDraft07, JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { synthesizeValue } from './synthesizeValue'
import { Options } from './Options'

type Schema = JSONSchemaDraft04 | JSONSchemaDraft06 | JSONSchemaDraft07 | JSONSchemaDraft2020_12

export function synthesizeObject(schema: Schema & object, options: Options): object {
  const { random } = options

  const object: any = {}
  Object.entries(schema.properties ?? {}).forEach(([propertyName, propertySchema]) => {
    const required = schema.required ? schema.required.includes(propertyName) : false
    if (required) {
      object[propertyName] = synthesizeValue(propertySchema, options)
    } else if (random() < 0.5) {
      object[propertyName] = synthesizeValue(propertySchema, options)
    }
  })
  return object
}
