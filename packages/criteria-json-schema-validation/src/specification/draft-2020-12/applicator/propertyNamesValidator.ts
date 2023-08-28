import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { InvalidOutput, Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function propertyNamesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('propertyNames' in schema)) {
    return null
  }

  const propertyNames = schema['propertyNames']
  const validator = context.validatorForSchema(propertyNames, `${schemaLocation}/propertyNames`)
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    // property names don't have a path from the root
    const outputs = Object.keys(instance).map((propertyName) => validator(propertyName, new InstanceContext('')))

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation: instanceContext.instanceLocation
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}
