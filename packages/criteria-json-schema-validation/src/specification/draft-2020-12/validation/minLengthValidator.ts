import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function minLengthValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const minLength = schema['minLength']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length >= minLength,
      `Expected string to contain at least ${minLength} characters but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'minLength', instanceLocation }
    )
  }
}
