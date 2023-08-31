import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { reduceAnnotationResults } from '../reduceAnnotationResults'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'

export function anyOfValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('anyOf' in schema)) {
    return null
  }

  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/anyOf/${i}`))
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const outputs = validators.map((validator) => validator(instance, instanceLocation))
    const validOutputs = outputs.filter((output) => output.valid) as ValidOutput[]
    if (validOutputs.length > 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'anyOf',
        instanceLocation,
        annotationResults: validOutputs
          .map((output) => output.annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'anyOf',
        instanceLocation,
        message: 'should validate against any subschema',
        errors: outputs as InvalidOutput[]
      }
    }
  }
}
