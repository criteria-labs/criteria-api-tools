import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function additionalPropertiesValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('additionalProperties' in schema)) {
    return null
  }

  const additionalProperties = schema['additionalProperties']
  const validator = context.validatorForSchema(additionalProperties, [...schemaPath, `/additionalProperties`])

  const properties = schema['properties'] ?? {}
  const expectedPropertyNames = Object.keys(properties)

  const patternProperties = schema['patternProperties'] ?? {}
  const expectedPatterns = Object.keys(patternProperties).map((pattern) => new RegExp(pattern))

  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (expectedPropertyNames.includes(propertyName)) {
        continue
      }
      if (expectedPatterns.some((regexp) => propertyName.match(regexp) !== null)) {
        continue
      }

      const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }

      if (!output.valid && failFast) {
        break
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      if (validOutputs.size > 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation,
          annotationResults: {
            additionalProperties: Array.from(validOutputs.keys())
          }
        }
      } else {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation
        }
      }
    } else {
      const entries = Array.from(invalidOutputs.entries())
      let message
      if (entries.length === 1) {
        message = `has an invalid property ('${entries[0][0]}' ${entries[0][1].message})`
      } else {
        message = `has invalid properties (${formatList(
          entries.map((entry) => `'${entry[0]}' ${entry[1].message}`),
          'and'
        )})`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'additionalProperties',
        instanceLocation,
        message,
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
