import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function maxLengthValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const maxLength = schema['maxLength']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length <= maxLength,
      `Expected string to contain up to ${maxLength} characters but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxLength', instanceLocation }
    )
  }
}
