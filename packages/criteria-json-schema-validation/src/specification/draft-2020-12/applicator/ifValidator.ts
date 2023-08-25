import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'
import { Output } from '../../output'

const trueValidator = (instance: unknown, instanceLocation: JSONPointer): Output => {
  return { valid: true }
}

export function ifValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const ifSchema = schema['if']
  const ifValidator = schemaValidator(ifSchema, `${schemaLocation}/if`, { cache, failFast })
  const thenSchema = schema['then']
  const thenValidator =
    thenSchema !== undefined
      ? schemaValidator(thenSchema, `${schemaLocation}/then`, { cache, failFast })
      : trueValidator
  const elseSchema = schema['else']
  const elseValidator =
    elseSchema !== undefined
      ? schemaValidator(elseSchema, `${schemaLocation}/else`, { cache, failFast })
      : trueValidator
  return (instance: unknown, instanceLocation: JSONPointer) => {
    const ifOutput = ifValidator(instance, instanceLocation)
    if (ifOutput.valid) {
      return thenValidator(instance, instanceLocation)
    } else {
      return elseValidator(instance, instanceLocation)
    }
  }
}
