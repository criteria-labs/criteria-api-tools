import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONNumber } from '../../../util/isJSONNumber'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function minimumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('minimum' in schema)) {
    return null
  }

  const minimum = schema['minimum']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true }
    }

    return assert(
      instance >= minimum,
      `Expected number greater than or equal to ${minimum} but found ${instance} instead`,
      {
        schemaLocation,
        schemaKeyword: 'minimum',
        instanceLocation: instanceContext.instanceLocation
      }
    )
  }
}
