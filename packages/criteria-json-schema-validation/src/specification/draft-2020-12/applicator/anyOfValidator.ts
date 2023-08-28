import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { InvalidOutput, Output, combineAnnotationResults } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function anyOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('anyOf' in schema)) {
    return null
  }

  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/anyOf/${i}`))
  return (instance: any, instanceContext: InstanceContext): Output => {
    const outputs = validators.map((validator) =>
      validator(instance, new InstanceContext(instanceContext.instanceLocation))
    )
    const validOutputs = outputs.filter((output) => output.valid)
    if (validOutputs.length > 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'anyOf',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: combineAnnotationResults(
          validOutputs.map((output) => ('annotationResults' in output ? output.annotationResults : {}))
        )
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'anyOf',
        instanceLocation: instanceContext.instanceLocation,
        errors: outputs as InvalidOutput[]
      }
    }
  }
}
