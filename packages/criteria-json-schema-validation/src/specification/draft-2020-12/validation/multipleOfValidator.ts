import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function multipleOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('multipleOf' in schema)) {
    return null
  }

  const multipleOf = schema['multipleOf']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }

    return assert(
      multipleOf !== 0 ? Number.isInteger(instance / multipleOf) : false,
      `Expected number to be a multiple of ${multipleOf} but found ${instance} instead`,
      { schemaLocation, schemaKeyword: 'multipleOf', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
