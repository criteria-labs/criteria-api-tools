import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function exclusiveMinimumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('exclusiveMinimum' in schema)) {
    return null
  }

  const exclusiveMinimum = schema['exclusiveMinimum']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }
    return assert(
      instance > exclusiveMinimum,
      `Expected number greater than ${exclusiveMinimum} but found ${instance} instead`,
      { schemaLocation, schemaKeyword: 'exclusiveMinimum', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
