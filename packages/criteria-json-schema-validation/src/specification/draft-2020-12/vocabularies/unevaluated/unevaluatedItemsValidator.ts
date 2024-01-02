import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidOutput, InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function unevaluatedItemsValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('unevaluatedItems' in schema)) {
    return null
  }

  const unevaluatedItems = schema['unevaluatedItems']
  const validator = context.validatorForSchema(unevaluatedItems, [...schemaPath, '/unevaluatedItems'])

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
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

    const errors = []
    const invalidIndices = []
    for (let i = firstUnevaluatedItem; i < instance.length; i++) {
      if (containsAnnotationResult && containsAnnotationResult.includes(i)) {
        continue
      }

      const output = validator(instance[i], `${instanceLocation}/${i}`)
      if (!output.valid) {
        if (failFast) {
          if (outputFormat === 'flag') {
            return { valid: false }
          } else {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'unevaluatedItems',
              instanceLocation,
              message: formatMessage([output as InvalidVerboseOutput], [i]),
              errors: [output as InvalidVerboseOutput]
            }
          }
        }
        errors.push(output)
        invalidIndices.push(i)
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'unevaluatedItems',
        instanceLocation,
        annotationResults: {
          unevaluatedItems: true // TODO: only true if actually applied to items
        }
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'unevaluatedItems',
          instanceLocation,
          message: formatMessage(errors, invalidIndices),
          errors
        }
      }
    }
  }
}

export function formatMessage(errors: InvalidVerboseOutput[] | null, invalidIndices: number[]) {
  let message
  if (invalidIndices.length === 1) {
    message = `has an invalid item at position ${invalidIndices[0]}`
  } else {
    message = `has invalid items at positions ${formatList(
      invalidIndices.map((invalidIndex) => `${invalidIndex}`),
      'and'
    )}`
  }
  if (errors !== null) {
    message += ` (${errors.map((error) => error.message).join('; ')})`
  }
  return message
}
