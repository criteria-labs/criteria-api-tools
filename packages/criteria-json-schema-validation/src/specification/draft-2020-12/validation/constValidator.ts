import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import circularEqual from '../../../util/circularEqual'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function constValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const constValue = schema['const']
  return (instance: any, instanceLocation: JSONPointer) => {
    const equal = circularEqual(instance, constValue)
    return assert(equal, `Expected value to ${constValue} but found ${instance} instead`, {
      schemaLocation,
      schemaKeyword: 'const',
      instanceLocation
    })
  }
}
