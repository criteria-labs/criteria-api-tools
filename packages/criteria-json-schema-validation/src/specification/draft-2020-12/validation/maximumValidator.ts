import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function maximumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('maximum' in schema)) {
    return null
  }

  const maximum = schema['maximum']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }

    return assert(
      instance <= maximum,
      `Expected number less than or equal to ${maximum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'maximum',
        instanceLocation: instanceContext.instanceLocation
      }
    )
  }
}
