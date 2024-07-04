import type { JSONPointer } from '@criteria/json-pointer'
import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { InvalidOutput, InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function patternPropertiesValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('patternProperties' in schema)) {
    return null
  }

  const patternProperties = schema['patternProperties']
  const patternValidators: [RegExp, BoundValidator][] = Object.keys(patternProperties).map((pattern) => {
    const regexp = new RegExp(pattern)
    const subschema = patternProperties[pattern]
    const subschemaValidator = context.validatorForSchema(subschema, [
      ...schemaPath,
      `/patternProperties/${escapeReferenceToken(pattern)}`
    ])
    return [regexp, subschemaValidator]
  })

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const validKeys = new Set()
    const invalidPropertyNames: string[] = []
    const errors: InvalidOutput[] = []
    const allPropertyNames = Object.keys(instance)
    for (const [regexp, validator] of patternValidators) {
      const propertyNames = allPropertyNames.filter((propertyName) => regexp.test(propertyName))
      for (const propertyName of propertyNames) {
        const output = validator(instance[propertyName], `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (output.valid) {
          validKeys.add(propertyName)
        } else {
          if (failFast) {
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
          errors.push(output as InvalidOutput)
        }
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        annotationResults: {
          patternProperties: Array.from(validKeys)
        }
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
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
}

export function formatMessage(errors: InvalidVerboseOutput[] | null, invalidPropertyNames: string[]) {
  let message
  if (invalidPropertyNames.length === 1) {
    message = `has an invalid property '${invalidPropertyNames[0]}'`
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
