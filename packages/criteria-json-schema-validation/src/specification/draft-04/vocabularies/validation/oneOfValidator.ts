import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function oneOfValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('oneOf' in schema)) {
    return null
  }

  const oneOf = schema['oneOf']
  const validators = oneOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/oneOf/${i}`))
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const outputs = validators.map((validator) => validator(instance, instanceLocation))
    const valid = outputs.filter((output) => output.valid).length === 1
    if (valid) {
      const validOutput = outputs.find((output) => output.valid)
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'oneOf',
        instanceLocation,
        annotationResults: 'annotationResults' in validOutput ? validOutput.annotationResults : {}
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'oneOf',
        instanceLocation,
        message: `should validate against exactly one subschema but validated against ${
          outputs.filter((output) => output.valid).length
        }`
      }
    }
  }
}
