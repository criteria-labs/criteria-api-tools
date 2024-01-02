import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { InvalidVerboseOutput, Output, ValidVerboseOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function anyOfValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('anyOf' in schema)) {
    return null
  }

  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema, i) => context.validatorForSchema(subschema, [...schemaPath, `/anyOf/${i}`]))

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const outputs = validators.map((validator) => validator(instance, instanceLocation))
    const validOutputs = outputs.filter((output) => output.valid) as ValidVerboseOutput[]
    if (outputs.some((output) => output.valid)) {
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
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'anyOf',
          instanceLocation,
          message: formatMessage(),
          errors: outputs as InvalidVerboseOutput[]
        }
      }
    }
  }
}

export function formatMessage() {
  return 'does not validate against any subschema'
}
