import { JSONSchemaDraft04, JSONSchemaDraft06, JSONSchemaDraft07, JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import seedrandom from 'seedrandom'
import { synthesizeValue } from './synthesize/synthesizeValue'
import { hash } from './util/hash'

type Schema = JSONSchemaDraft04 | JSONSchemaDraft06 | JSONSchemaDraft07 | JSONSchemaDraft2020_12

export function synthesizeDataWithJSONSchema(schema: Schema): any {
  const seed = typeof schema === 'object' ? hash(schema) : `${schema}`
  const random = seedrandom(seed)
  return synthesizeValue(schema, { random })
}
