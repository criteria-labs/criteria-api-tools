import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { InvalidOutput, InvalidVerboseOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function propertiesValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('properties' in schema)) {
    return null
  }

  const properties = schema['properties']
  const propertyValidators: [string, string, BoundValidator][] = Object.keys(properties).map((propertyName) => {
    const subschema = properties[propertyName]
    const subschemaValidator = context.validatorForSchema(subschema, [
      ...schemaPath,
      `/properties/${escapeReferenceToken(propertyName)}`
    ])
    return [propertyName, escapeReferenceToken(propertyName), subschemaValidator]
  })

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer

  if (outputFormat === 'flag') {
    return function validateInstance(
      instance: any,
      instanceLocation: JSONPointer,
      annotationResults: Record<string, any>
    ): Output {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }

      let validKeys = []
      for (const [propertyName, escapedPropertyName, subschemaValidator] of propertyValidators) {
        if (!instance.hasOwnProperty(propertyName)) {
          continue
        }

        const output = subschemaValidator(instance[propertyName], `${instanceLocation}/${escapedPropertyName}`)
        if (output.valid) {
          validKeys.push(propertyName)
        } else {
          return { valid: false }
        }
      }
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation,
        annotationResults: {
          properties: validKeys
        }
      }
    }
  } else {
    return function validateInstance(
      instance: any,
      instanceLocation: JSONPointer,
      annotationResults: Record<string, any>
    ): Output {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }

      const validKeys = []
      const invalidPropertyNames: string[] = []
      const errors: InvalidOutput[] = []
      for (const [propertyName, escapedPropertyName, subschemaValidator] of propertyValidators) {
        if (!instance.hasOwnProperty(propertyName)) {
          continue
        }

        const output = subschemaValidator(instance[propertyName], `${instanceLocation}/${escapedPropertyName}`)
        if (output.valid) {
          validKeys.push(propertyName)
        } else {
          if (failFast) {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'properties',
              instanceLocation,
              message: formatMessage([output as InvalidVerboseOutput], [propertyName]),
              errors: [output as InvalidVerboseOutput]
            }
          }
          invalidPropertyNames.push(propertyName)
          errors.push(output as InvalidVerboseOutput)
        }
      }

      if (errors.length === 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'properties',
          instanceLocation,
          annotationResults: {
            properties: validKeys
          }
        }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'properties',
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
