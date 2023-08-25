import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function maximumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const maximum = schema['maximum']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }

    return assert(
      instance <= maximum,
      `Expected number less than or equal to ${maximum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'maximum',
        instanceLocation
      }
    )
  }
}
