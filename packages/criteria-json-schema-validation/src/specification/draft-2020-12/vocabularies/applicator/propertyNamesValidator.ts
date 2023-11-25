import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function propertyNamesValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('propertyNames' in schema)) {
    return null
  }

  const propertyNames = schema['propertyNames']
  const validator = context.validatorForSchema(propertyNames, [...schemaPath, `/propertyNames`])
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const propertyName of Object.keys(instance)) {
      // property names don't have a path from the root
      const output = validator(propertyName, '')
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation
      }
    } else {
      const entries = Array.from(invalidOutputs.entries())
      let message
      if (entries.length === 1) {
        message = `has invalid property name ('${entries[0][0]}' ${entries[0][1]})`
      } else {
        message = `has invalid property names (${formatList(
          entries.map((entry) => `'${entry[0]}' ${entry[1]}`),
          'and'
        )})`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation,
        message,
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
