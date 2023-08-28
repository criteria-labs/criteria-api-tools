import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function exclusiveMaximumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('exclusiveMaximum' in schema)) {
    return null
  }

  const exclusiveMaximum = schema['exclusiveMaximum']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }
    return assert(
      instance < exclusiveMaximum,
      `Expected number less than ${exclusiveMaximum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'exclusiveMaximum',
        instanceLocation: instanceContext.instanceLocation
      }
    )
  }
}
