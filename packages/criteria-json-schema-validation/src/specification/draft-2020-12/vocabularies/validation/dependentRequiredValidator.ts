import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function dependentRequiredValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('dependentRequired' in schema)) {
    return null
  }

  const dependentRequired = schema['dependentRequired']

  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, dependencies] of Object.entries(dependentRequired)) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const missingProperties = []
      for (const dependency of dependencies) {
        if (!instance.hasOwnProperty(dependency)) {
          missingProperties.push(dependency)
        }
      }

      const output = assert(
        missingProperties.length === 0,
        `is mising ${formatList(
          missingProperties.map((missingProperty) => `'${missingProperty}'`),
          'and'
        )}`,
        { schemaLocation, schemaKeyword: 'dependentRequired', instanceLocation }
      )
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }

      if (!output.valid && failFast) {
        return output
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentRequired',
        instanceLocation
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'dependentRequired',
        instanceLocation,
        message: formatList(
          Array.from(invalidOutputs.values()).map((output) => output.message),
          'and'
        ),
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
