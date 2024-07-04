import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function itemsValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('items' in schema)) {
    return null
  }

  const items = schema['items']
  if (Array.isArray(items)) {
    const itemValidators = items.map((subschema, i) =>
      context.validatorForSchema(subschema, [...schemaPath, `/items/${i}`])
    )

    const outputFormat = context.outputFormat
    const failFast = context.failFast
    const schemaLocation = schemaPath.join('') as JSONPointer
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONArray(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }

      const validOutputs = []
      const errors = []
      const invalidIndices = []
      for (let i = 0; i < instance.length && i < itemValidators.length; i++) {
        const validator = itemValidators[i]
        const output = validator(instance[i], `${instanceLocation}/${i}`)
        if (output.valid) {
          validOutputs.push(output)
        } else {
          if (failFast) {
            return output
          }
          invalidIndices.push(i)
          errors.push(output)
        }
      }

      if (errors.length === 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'items',
          instanceLocation,
          annotationResults: {
            items: validOutputs.length < instance.length ? validOutputs.length - 1 : true
          }
        }
      } else {
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'items',
            instanceLocation,
            message: formatMessage(errors, invalidIndices),
            errors
          }
        }
      }
    }
  } else {
    const validator = context.validatorForSchema(items, [...schemaPath, '/items'])

    const outputFormat = context.outputFormat
    const failFast = context.failFast
    const schemaLocation = schemaPath.join('') as JSONPointer
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONArray(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }

      const validOutputs = []
      const invalidIndices = []
      const errors = []
      for (let i = 0; i < instance.length; i++) {
        const output = validator(instance[i], `${instanceLocation}/${i}`)
        if (output.valid) {
          validOutputs.push(output)
        } else {
          if (failFast) {
            return output
          }
          invalidIndices.push(i)
          errors.push(output)
        }
      }

      if (errors.length === 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'items',
          instanceLocation,
          annotationResults: {
            items: validOutputs.length < instance.length ? validOutputs.length - 1 : true
          }
        }
      } else {
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'items',
            instanceLocation,
            message: formatMessage(errors, invalidIndices),
            errors
          }
        }
      }
    }
  }
}

export function formatMessage(errors: InvalidVerboseOutput[], invalidIndices: number[]) {
  if (invalidIndices.length === 1) {
    return `has an invalid item at position ${invalidIndices[0]} (${errors[0].message})`
  } else {
    return `has invalid items at positions ${formatList(
      invalidIndices.map((i) => `${i}`),
      'and'
    )} (${errors.map((error) => error.message).join('; ')})`
  }
}
