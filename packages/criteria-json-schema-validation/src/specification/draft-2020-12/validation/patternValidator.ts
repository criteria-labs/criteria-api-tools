import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function patternValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const pattern = schema['pattern']
  const regexp = new RegExp(pattern)
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    return assert(instance.match(regexp), `Expected string to match '${pattern}' but found ${instance} instead`, {
      schemaLocation,
      schemaKeyword: 'pattern',
      instanceLocation
    })
  }
}
