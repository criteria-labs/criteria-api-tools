import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function patternValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('pattern' in schema)) {
    return null
  }

  const pattern = schema['pattern']
  const regexp = new RegExp(pattern)
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    return assert(instance.match(regexp), `Expected string to match '${pattern}' but found ${instance} instead`, {
      schemaLocation,
      schemaKeyword: 'pattern',
      instanceLocation: instanceContext.instanceLocation
    })
  }
}
