import type { JSONPointer } from '@criteria/json-pointer'
import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { InvalidOutput, InvalidVerboseOutput, Output, ValidOutput } from '../../../../validation/Output'
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
    const regexp = new RegExp(pattern, 'u')
    const subschema = patternProperties[pattern]
    const subschemaValidator = context.validatorForSchema(subschema, [
      ...schemaPath,
      `/patternProperties/${escapeReferenceToken(pattern)}`
    ])
    return [pattern, regexp, subschemaValidator]
  })

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    const invalidPropertyNames: string[] = []
    const errors: InvalidOutput[] = []
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      for (const [pattern, regexp, validator] of patternValidators) {
        // what if multiple patterns match the property?

        if (!regexp.test(propertyName)) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (!output.valid && failFast) {
          if (outputFormat === 'flag') {
            return { valid: false }
          } else {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'patternProperties',
              instanceLocation,
              message: formatMessage([output as InvalidVerboseOutput], [propertyName]),
              errors: [output as InvalidVerboseOutput]
            }
          }
        }

        if (output.valid) {
          validOutputs.set(propertyName, output)
        } else {
          invalidPropertyNames.push(propertyName)
          errors.push(output as InvalidOutput)
        }
      }

      // Property didn't match name or pattern
    }

    if (errors.length === 0) {
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
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        message: formatMessage(errors as InvalidVerboseOutput[], invalidPropertyNames),
        errors: errors as InvalidVerboseOutput[]
      }
    }
  }
}

export function formatMessage(errors: InvalidVerboseOutput[] | null, invalidPropertyNames: string[]) {
  let message
  if (invalidPropertyNames.length === 1) {
    message = `has an invalid property ${invalidPropertyNames[0]}`
  } else {
    message = `has invalid properties ${formatList(
      invalidPropertyNames.map((propertyName) => `'${propertyName}'`),
      'and'
    )}`
  }
  if (errors !== null) {
    message += ` (${errors.map((error) => error.message).join('; ')})`
  }
  return message
}
