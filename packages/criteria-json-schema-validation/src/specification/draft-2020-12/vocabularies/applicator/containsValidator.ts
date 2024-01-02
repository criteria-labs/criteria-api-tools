import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function containsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('contains' in schema)) {
    return null
  }

  const contains = schema['contains']
  const validator = context.validatorForSchema(contains, [...schemaPath, '/contains'])

  let minContains = 1
  if ('minContains' in schema) {
    minContains = Math.min(minContains, schema['minContains'])
  }

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
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

    if (matchedIndices.length >= minContains) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'contains',
        instanceLocation,
        annotationResults: {
          contains: matchedIndices
        }
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'contains',
          instanceLocation,
          message: formatMessage(),
          errors: outputs.filter((output) => !output.valid) as InvalidVerboseOutput[]
        }
      }
    }
  }
}

export function formatMessage() {
  return 'does not contain an item that validates against a subschema'
}
