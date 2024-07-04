import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidOutput, InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function prefixItemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('prefixItems' in schema)) {
    return null
  }

  const prefixItems = schema['prefixItems']
  const prefixItemValidators = prefixItems.map((subschema, i) =>
    context.validatorForSchema(subschema, [...schemaPath, `/prefixItems/${i}`])
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
    for (let i = 0; i < instance.length && i < prefixItemValidators.length; i++) {
      const validator = prefixItemValidators[i]
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      if (output.valid) {
        validOutputs.push(output)
      } else {
        if (failFast) {
          return output
        }
        errors.push(output)
        invalidIndices.push(i)
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'prefixItems',
        instanceLocation,
        annotationResults: {
          prefixItems: validOutputs.length < instance.length ? validOutputs.length - 1 : true
        }
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'prefixItems',
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
