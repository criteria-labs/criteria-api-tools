import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { ValidationContext } from '../ValidationContext'
import { InstanceContext } from '../InstanceContext'
import { Output } from '../../output'

export function notValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('not' in schema)) {
    return null
  }

  const not = schema['not']
  const validator = context.validatorForSchema(not, `${schemaLocation}/not`)
  return (instance: unknown, instanceContext: InstanceContext): Output => {
    const output = validator(instance, new InstanceContext(instanceContext.instanceLocation))
    if (output.valid) {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'not',
        instanceLocation: instanceContext.instanceLocation,
        error: 'Expected value to fail validation against not schema'
      }
    } else {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'not',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {}
      }
    }
  }
}
