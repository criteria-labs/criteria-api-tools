import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { reduceAnnotationResults } from '../reduceAnnotationResults'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { formatList } from '../../../../util/formatList'

export function allOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('allOf' in schema)) {
    return null
  }

  const allOf = schema['allOf']
  const validators = allOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/allOf/${i}`))
  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const outputs = []
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const output = validator(instance, instanceLocation)
      outputs.push(output)
      if (!output.valid && failFast) {
        return output
      }
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'allOf',
        instanceLocation,
        annotationResults: outputs.map((output) => output.annotationResults ?? {}).reduce(reduceAnnotationResults, {})
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'allOf',
        instanceLocation,
        message: formatList(
          invalidOutputs.map((output) => output.message),
          'and'
        ),
        errors: invalidOutputs
      }
    }
  }
}
