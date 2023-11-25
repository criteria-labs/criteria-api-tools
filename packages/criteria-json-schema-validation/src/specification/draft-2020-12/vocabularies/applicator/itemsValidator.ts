import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function itemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('items' in schema)) {
    return null
  }

  const items = schema['items']
  const validator = context.validatorForSchema(items, [...schemaPath, '/items'])

  const prefixItems = schema['prefixItems'] ?? []
  const schemaLocation = schemaPath.join('') as JSONPointer
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
