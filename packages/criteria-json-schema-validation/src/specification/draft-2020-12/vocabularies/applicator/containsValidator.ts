import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output } from '../../../../validation/Output'

export function containsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('contains' in schema)) {
    return null
  }

  const contains = schema['contains']
  const validator = context.validatorForSchema(contains, `${schemaLocation}/contains`)

  let minContains = 1
  if ('minContains' in schema) {
    minContains = Math.min(minContains, schema['minContains'])
  }

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation, schemaKeyword: 'contains' }
    }

    const outputs = []
    const matchedIndices = []
    for (let index = 0; index < instance.length; index++) {
      const output = validator(instance[index], `${instanceLocation}/${index}`)
      outputs.push(output)
      if (output.valid) {
        matchedIndices.push(index)
      }
    }

    const valid = matchedIndices.length >= minContains
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'contains',
        instanceLocation,
        annotationResults: {
          contains: matchedIndices
        } as any
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'contains',
        instanceLocation,
        message: 'Expected array to contain an item that validates against subschema',
        errors: outputs.filter((output) => !output.valid) as InvalidOutput[]
      }
    }
  }
}
