import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { formatList } from '../../../../util/formatList'

export function unevaluatedItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('unevaluatedItems' in schema)) {
    return null
  }

  const unevaluatedItems = schema['unevaluatedItems']
  const validator = context.validatorForSchema(unevaluatedItems, `${schemaLocation}/unevaluatedItems`)

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const prefixItemsAnnotationResult = annotationResults['prefixItems']
    const itemsAnnotationResult = annotationResults['items']
    const containsAnnotationResult = annotationResults['contains']
    const unevaluatedItemsAnnotationResult = annotationResults['unevaluatedItems']

    let firstUnevaluatedItem = 0
    if (typeof prefixItemsAnnotationResult === 'number') {
      firstUnevaluatedItem = Math.max(firstUnevaluatedItem, prefixItemsAnnotationResult + 1)
    }
    if (typeof prefixItemsAnnotationResult === 'boolean' && prefixItemsAnnotationResult) {
      firstUnevaluatedItem = Math.max(firstUnevaluatedItem, instance.length)
    }
    if (typeof itemsAnnotationResult === 'boolean' && itemsAnnotationResult) {
      firstUnevaluatedItem = Math.max(firstUnevaluatedItem, instance.length)
    }
    if (typeof unevaluatedItemsAnnotationResult === 'boolean' && unevaluatedItemsAnnotationResult) {
      firstUnevaluatedItem = Math.max(firstUnevaluatedItem, instance.length)
    }

    const outputs = []
    const invalidIndices = []
    for (let i = firstUnevaluatedItem; i < instance.length; i++) {
      if (containsAnnotationResult && containsAnnotationResult.includes(i)) {
        continue
      }

      const output = validator(instance[i], `${instanceLocation}/${i}`)
      outputs.push(output)
      if (!output.valid) {
        invalidIndices.push(i)
      }

      if (!output.valid && failFast) {
        break
      }
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'unevaluatedItems',
        instanceLocation,
        annotationResults: {
          unevaluatedItems: true // TODO: only true if actually applied to items
        }
      } as any
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
        schemaKeyword: 'unevaluatedItems',
        instanceLocation,
        message,
        errors: invalidOutputs
      } as any
    }
  }
}
