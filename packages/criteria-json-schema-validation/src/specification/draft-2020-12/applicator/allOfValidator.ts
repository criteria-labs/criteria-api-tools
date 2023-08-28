import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { InvalidOutput, Output, combineAnnotationResults } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function allOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('allOf' in schema)) {
    return null
  }

  const allOf = schema['allOf']
  const validators = allOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/allOf/${i}`))
  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    const outputs = []
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const output = validator(instance, new InstanceContext(instanceContext.instanceLocation))
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
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: combineAnnotationResults(outputs.map((output) => output.annotationResults ?? {}))
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'allOf',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}