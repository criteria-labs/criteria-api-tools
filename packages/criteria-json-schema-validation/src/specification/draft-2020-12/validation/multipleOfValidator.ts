import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function multipleOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const multipleOf = schema['multipleOf']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }

    return assert(
      multipleOf !== 0 ? Number.isInteger(instance / multipleOf) : false,
      `Expected number to be a multiple of ${multipleOf} but found ${instance} instead`,
      { schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
    )
  }
}
