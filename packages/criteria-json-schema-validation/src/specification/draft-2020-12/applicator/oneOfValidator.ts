import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { ValidationContext } from '../ValidationContext'
import { InstanceContext } from '../InstanceContext'
import { Output } from '../../output'

export function oneOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('oneOf' in schema)) {
    return null
  }

  const oneOf = schema['oneOf']
  const validators = oneOf.map((subschema, i) => context.validatorForSchema(subschema, `${schemaLocation}/oneOf/${i}`))
  return (instance: any, instanceContext: InstanceContext): Output => {
    const outputs = validators.map((validator) => validator(instance, instanceContext.clone()))
    const valid = outputs.filter((output) => output.valid).length === 1
    if (valid) {
      const validOutput = outputs.find((output) => output.valid)
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'oneOf',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: 'annotationResults' in validOutput ? validOutput.annotationResults : {}
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'oneOf',
        instanceLocation: instanceContext.instanceLocation,
        error: `Expected value to validate against exactly one subschema`
      }
    }
  }
}
