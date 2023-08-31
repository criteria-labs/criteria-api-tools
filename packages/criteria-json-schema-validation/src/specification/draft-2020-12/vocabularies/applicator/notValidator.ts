import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function notValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
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
        message: 'should not validate against subschema'
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
