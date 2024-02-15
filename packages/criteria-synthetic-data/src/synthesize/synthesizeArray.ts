import { JSONSchemaDraft04, JSONSchemaDraft06, JSONSchemaDraft07, JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { synthesizeValue } from './synthesizeValue'
import { Options } from './Options'

type Schema = JSONSchemaDraft04 | JSONSchemaDraft06 | JSONSchemaDraft07 | JSONSchemaDraft2020_12

export function synthesizeArray(schema: Schema & object, options: Options): any[] {
  const { random } = options

  const minItems = schema.minItems ?? options.minItems ?? 1
  const maxItems = schema.maxItems ?? options.maxItems ?? 3
  const span = Math.max(maxItems - minItems, 0)

  const array: any = []
  const length = minItems + span * random()
  for (let i = 0; i < length; i++) {
    array.push(synthesizeValue(schema.items ?? {}, options))
  }
  return array
}
