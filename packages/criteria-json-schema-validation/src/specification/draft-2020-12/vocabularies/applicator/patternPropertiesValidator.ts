import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function patternPropertiesValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('patternProperties' in schema)) {
    return null
  }

  const patternProperties = schema['patternProperties']
  const patternValidators: [string, RegExp, BoundValidator][] = Object.keys(patternProperties).map((pattern) => {
    const regexp = new RegExp(pattern)
    const subschema = patternProperties[pattern]
    const subschemaValidator = context.validatorForSchema(subschema, [
      ...schemaPath,
      `/patternProperties/${escapeReferenceToken(pattern)}`
    ])
    return [pattern, regexp, subschemaValidator]
  })

  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      for (const [pattern, regexp, validator] of patternValidators) {
        // what if multiple patterns match the property?

        if (propertyName.match(regexp) === null) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (output.valid) {
          validOutputs.set(propertyName, output)
        } else {
          invalidOutputs.set(propertyName, output as InvalidOutput)
        }

        if (!output.valid && failFast) {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'patternProperties',
            instanceLocation,
            message: `Invalid property ${propertyName}`,
            errors: [output as InvalidOutput]
          }
        }
      }

      // Property didn't match name or pattern
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        annotationResults: {
          patternProperties: Array.from(validOutputs.keys())
        }
      }
    } else {
      const entries = Array.from(invalidOutputs.entries())
      let message
      if (entries.length === 1) {
        message = `has invalid property ('${entries[0][0]}' ${entries[0][1]})`
      } else {
        message = `has invalid properties (${formatList(
          entries.map((entry) => `'${entry[0]}' ${entry[1]}`),
          'and'
        )})`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        message,
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
