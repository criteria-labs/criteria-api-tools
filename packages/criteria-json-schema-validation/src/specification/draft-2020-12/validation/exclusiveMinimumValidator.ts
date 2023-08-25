import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'
import { isJSONNumber } from '../../../util/isJSONNumber'

export function exclusiveMinimumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const exclusiveMinimum = schema['exclusiveMinimum']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }
    return assert(
      instance > exclusiveMinimum,
      `Expected number greater than ${exclusiveMinimum} but found ${instance} instead`,
      { schemaLocation, schemaKeyword: 'exclusiveMinimum', instanceLocation }
    )
  }
}
