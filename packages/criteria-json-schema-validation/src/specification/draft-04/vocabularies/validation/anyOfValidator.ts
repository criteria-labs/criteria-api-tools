import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { InvalidVerboseOutput, Output, ValidOutput, ValidVerboseOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'
import { formatList } from '../../../../util/formatList'

export function anyOfValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('anyOf' in schema)) {
    return null
  }

  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema, i) => context.validatorForSchema(subschema, [...schemaPath, `/anyOf/${i}`]))

  const outputFormat = context.outputFormat
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
          .map((output) => (output as ValidVerboseOutput).annotationResults ?? {})
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
          message: formatMessage(outputs as InvalidVerboseOutput[]),
          errors: outputs as InvalidVerboseOutput[]
        }
      }
    }
  }
}

export function formatMessage(errors: InvalidVerboseOutput[]) {
  return formatList(
    errors.map((error) => error.message),
    'or'
  )
}
