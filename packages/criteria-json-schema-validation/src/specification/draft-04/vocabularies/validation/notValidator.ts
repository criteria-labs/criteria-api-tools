import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function notValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('not' in schema)) {
    return null
  }

  const not = schema['not']
  const validator = context.validatorForSchema(not, [...schemaPath, '/not'])
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: unknown, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const output = validator(instance, instanceLocation)
    if (output.valid) {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'not',
        instanceLocation,
        message: formatMessage()
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

export function formatMessage() {
  return 'should not validate against subschema'
}
