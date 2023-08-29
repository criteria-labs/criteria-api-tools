import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { formatList } from '../../../../util/formatList'

export function prefixItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('prefixItems' in schema)) {
    return null
  }

  const prefixItems = schema['prefixItems']
  const prefixItemValidators = prefixItems.map((subschema, i) =>
    context.validatorForSchema(subschema, `${schemaLocation}/prefixItems/${i}`)
  )

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const outputs = []
    const invalidIndices = []
    for (let i = 0; i < instance.length && i < prefixItemValidators.length; i++) {
      const validator = prefixItemValidators[i]
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
        schemaKeyword: 'prefixItems',
        instanceLocation,
        annotationResults: {
          prefixItems: outputs.length < instance.length ? outputs.length - 1 : true
        }
      }
    } else {
      let message
      if (invalidIndices.length === 1) {
        message = `Invalid prefix item at index ${invalidIndices[0]}`
      } else {
        message = `Invalid prefix items at indices ${formatList(
          invalidIndices.map((i) => `${i}`),
          'and'
        )}`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'prefixItems',
        instanceLocation,
        message,
        errors: invalidOutputs
      }
    }
  }
}
