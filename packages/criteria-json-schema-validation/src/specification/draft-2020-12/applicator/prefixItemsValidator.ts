import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../output'
import { ValidationContext } from '../ValidationContext'
import { InstanceContext } from '../InstanceContext'

export function prefixItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('prefixItems' in schema)) {
    return null
  }

  const prefixItems = schema['prefixItems']
  const prefixItemValidators = prefixItems.map((subschema, i) =>
    context.validatorForSchema(subschema, `${schemaLocation}/prefixItems/${i}`)
  )

  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (let i = 0; i < instance.length && i < prefixItemValidators.length; i++) {
      const validator = prefixItemValidators[i]
      const output = validator(instance[i], instanceContext.appendingInstanceLocation(`/${i}`))
      outputs.push(output)
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'prefixItems',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          prefixItems: outputs.length < instance.length ? outputs.length - 1 : true
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'prefixItems',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}
