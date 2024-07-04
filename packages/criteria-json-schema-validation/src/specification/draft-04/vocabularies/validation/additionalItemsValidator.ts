import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidVerboseOutput, Output } from '../../../../validation/Output'
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

  const itemsCount = (schema['items'] ?? []).length

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer

  // short-cut
  if (additionalItems === true) {
    return null // TODO: what about annotations
  }
  if (additionalItems === false) {
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONArray(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }

      const valid = instance.length <= itemsCount
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
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          const invalidIndices = Array.from({ length: instance.length - itemsCount }, (_, i) => itemsCount + i)
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'additionalItems',
            instanceLocation,
            message: formatMessage(null, invalidIndices)
          }
        }
      }
    }
  }

  const validator = context.validatorForSchema(additionalItems, [...schemaPath, '/additionalItems'])

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const invalidIndices = []
    const errors = []
    for (let i = itemsCount; i < instance.length; i++) {
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      if (!output.valid && failFast) {
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'additionalItems',
            instanceLocation,
            message: formatMessage([output as InvalidVerboseOutput], [i])
          }
        }
      }

      if (output.valid) {
        // outputs.push(output)
      } else {
        invalidIndices.push(i)
        errors.push(output)
      }
    }

    if (errors.length === 0) {
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
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'additionalItems',
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
