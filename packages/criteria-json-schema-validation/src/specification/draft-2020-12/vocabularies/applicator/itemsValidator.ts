import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function itemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('items' in schema)) {
    return null
  }

  const items = schema['items']
  const validator = context.validatorForSchema(items, [...schemaPath, '/items'])

  const prefixItems = schema['prefixItems'] ?? []

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const invalidIndices = []
    const errors = []
    for (let i = prefixItems.length ?? 0; i < instance.length; i++) {
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      if (!output.valid) {
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
          items: true // TODO: only true if actually applied to items
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
