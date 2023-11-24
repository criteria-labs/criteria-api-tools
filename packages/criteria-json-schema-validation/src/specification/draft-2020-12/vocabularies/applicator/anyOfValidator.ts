import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function anyOfValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('anyOf' in schema)) {
    return null
  }

  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema, i) => context.validatorForSchema(subschema, [...schemaPath, `/anyOf/${i}`]))
  const schemaLocation = schemaPath.join('') as JSONPointer
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
