import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function allOfValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('allOf' in schema)) {
    return null
  }

  const allOf = schema['allOf']
  const validators = allOf.map((subschema, i) => context.validatorForSchema(subschema, [...schemaPath, `/allOf/${i}`]))

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const validOutputs = []
    const errors = []
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const output = validator(instance, instanceLocation)
      if (output.valid) {
        validOutputs.push(output)
      } else {
        if (failFast) {
          return output
        }
        errors.push(output)
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'allOf',
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
          schemaKeyword: 'allOf',
          instanceLocation,
          message: formatList(
            errors.map((output) => output.message),
            'and'
          ),
          errors: errors
        }
      }
    }
  }
}
