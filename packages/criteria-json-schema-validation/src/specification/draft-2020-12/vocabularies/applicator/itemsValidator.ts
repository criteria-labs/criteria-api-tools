import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { format } from 'prettier'
import { formatList } from '../../../../util/formatList'

export function itemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('items' in schema)) {
    return null
  }

  const items = schema['items']
  const validator = context.validatorForSchema(items, `${schemaLocation}/items`)

  const prefixItems = schema['prefixItems'] ?? []
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const outputs = []
    const invalidIndices = []
    for (let i = prefixItems.length ?? 0; i < instance.length; i++) {
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      outputs.push(output)
      if (!output.valid) {
        invalidIndices.push(i)
      }
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'items',
        instanceLocation,
        annotationResults: {
          items: true // TODO: only true if actually applied to items
        }
      }
    } else {
      let message
      if (invalidIndices.length === 1) {
        message = `has invalid item (item at ${invalidIndices[0]} ${invalidOutputs[0].message})`
      } else {
        message = `has invalid items (${formatList(
          invalidIndices.map((i, offset) => `item at ${i} ${invalidOutputs[offset].message}`),
          'and'
        )})`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'items',
        instanceLocation,
        message,
        errors: invalidOutputs
      }
    }
  }
}
