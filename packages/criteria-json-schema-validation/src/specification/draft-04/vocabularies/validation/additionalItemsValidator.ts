import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function additionalItemsValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('additionalItems' in schema)) {
    return null
  }

  // if "items" is not present, or its value is an object, validation
  // of the instance always succeeds, regardless of the value of
  // "additionalItems";
  if (!('items' in schema) || !Array.isArray(schema['items'])) {
    return null
  }

  const additionalItems = schema['additionalItems']
  const validator = context.validatorForSchema(additionalItems, [...schemaPath, '/additionalItems'])

  const items = schema['items'] ?? []
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const outputs = []
    const invalidIndices = []
    for (let i = items.length ?? 0; i < instance.length; i++) {
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
        schemaKeyword: 'additionalItems',
        instanceLocation,
        annotationResults: {
          additionalItems: true // TODO: only true if actually applied to additional items
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
        schemaKeyword: 'additionalItems',
        instanceLocation,
        message,
        errors: invalidOutputs
      }
    }
  }
}
