import { JSONSchemaDraft04, JSONSchemaDraft06, JSONSchemaDraft07, JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Options } from './Options'

type Schema = JSONSchemaDraft04 | JSONSchemaDraft06 | JSONSchemaDraft07 | JSONSchemaDraft2020_12

export function synthesizeNumber(schema: Schema & object, options: Options): number {
  const { random } = options

  const minimum = schema.minimum ?? options.minimum ?? 0
  const maximum = schema.maximum ?? options.maximum ?? minimum + 10
  const span = Math.max(maximum - minimum, 0)

  if (schema.type === 'integer') {
    return minimum + Math.floor(span * random())
  }
  if (schema.type === 'number') {
    return minimum + Math.floor(span * 10 * random()) / 1
  }

  return 0
}
