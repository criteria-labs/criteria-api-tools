import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function notValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('not' in schema)) {
    return null
  }

  const not = schema['not']
  const validator = context.validatorForSchema(not, `${schemaLocation}/not`)
  return (instance: unknown, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const output = validator(instance, instanceLocation)
    if (output.valid) {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'not',
        instanceLocation,
        message: 'Expected value to fail validation against not schema'
      }
    } else {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'not',
        instanceLocation
      }
    }
  }
}
