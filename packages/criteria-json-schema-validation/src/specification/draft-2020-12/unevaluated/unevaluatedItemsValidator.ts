import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function unevaluatedItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('unevaluatedItems' in schema)) {
    return null
  }

  const unevaluatedItems = schema['unevaluatedItems']
  const validator = context.validatorForSchema(unevaluatedItems, `${schemaLocation}/unevaluatedItems`)

  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const prefixItemsAnnotationResult = instanceContext.annotationResultForKeyword('prefixItems')
    const itemsAnnotationResult = instanceContext.annotationResultForKeyword('items')
    const containsAnnotationResult = instanceContext.annotationResultForKeyword('contains') ?? []
    const unevaluatedItemsAnnotationResult = instanceContext.annotationResultForKeyword('unevaluatedItems')

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
    for (let i = firstUnevaluatedItem; i < instance.length; i++) {
      if (containsAnnotationResult.includes(i)) {
        continue
      }

      const output = validator(instance[i], instanceContext.appendingInstanceLocation(`/${i}`))
      outputs.push(output)

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
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          unevaluatedItems: true // TODO: only true if actually applied to items
        }
      } as any
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'unevaluatedItems',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      } as any
    }
  }
}
