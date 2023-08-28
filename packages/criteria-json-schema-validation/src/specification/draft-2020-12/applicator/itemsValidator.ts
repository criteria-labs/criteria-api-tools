import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function itemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('items' in schema)) {
    return null
  }

  const items = schema['items']
  const validator = context.validatorForSchema(items, `${schemaLocation}/items`)

  const prefixItems = schema['prefixItems'] ?? []
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (let i = prefixItems.length ?? 0; i < instance.length; i++) {
      const output = validator(instance[i], instanceContext.appendingInstanceLocation(`/${i}`))
      outputs.push(output)
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'items',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          items: true // TODO: only true if actually applied to items
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'items',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}
