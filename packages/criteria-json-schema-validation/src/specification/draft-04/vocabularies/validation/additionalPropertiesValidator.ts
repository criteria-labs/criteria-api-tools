import { escapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidVerboseOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function validatorForNoAdditionalProperties(
  schema: JSONSchema,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer

  const properties = schema['properties'] ?? {}
  const expectedPropertyNames = Object.keys(properties)

  const patternProperties = schema['patternProperties'] ?? {}
  const expectedPatterns = Object.keys(patternProperties).map((pattern) => new RegExp(pattern))

  if (outputFormat === 'flag') {
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }
      for (const propertyName of Object.keys(instance)) {
        if (expectedPropertyNames.includes(propertyName)) {
          continue
        }
        if (expectedPatterns.some((regexp) => regexp.test(propertyName))) {
          continue
        }
        return { valid: false }
      }
      return { valid: true, schemaLocation, schemaKeyword: 'additionalProperties', instanceLocation }
    }
  } else {
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }
      const invalidPropertyNames = []
      for (const propertyName of Object.keys(instance)) {
        if (expectedPropertyNames.includes(propertyName)) {
          continue
        }
        if (expectedPatterns.some((regexp) => regexp.test(propertyName))) {
          continue
        }
        if (failFast) {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'additionalProperties',
            instanceLocation,
            message: formatMessage(null, [propertyName])
          }
        }
        invalidPropertyNames.push(propertyName)
      }
      if (invalidPropertyNames.length === 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation
        }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation,
          message: formatMessage(null, invalidPropertyNames)
        }
      }
    }
  }
}

export function additionalPropertiesValidator(
  schema: JSONSchema,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('additionalProperties' in schema)) {
    return null
  }

  const additionalProperties = schema['additionalProperties']
  if (additionalProperties === true) {
    return null // TODO: what about annotations
  }
  if (additionalProperties === false) {
    return validatorForNoAdditionalProperties(schema, schemaPath, context)
  }

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer

  const validator = context.validatorForSchema(additionalProperties, [...schemaPath, '/additionalProperties'])

  const properties = schema['properties'] ?? {}
  const expectedPropertyNames = Object.keys(properties)

  const patternProperties = schema['patternProperties'] ?? {}
  const expectedPatterns = Object.keys(patternProperties).map((pattern) => new RegExp(pattern))

  if (outputFormat === 'flag') {
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }
      for (const [propertyName, propertyValue] of Object.entries(instance)) {
        if (expectedPropertyNames.includes(propertyName)) {
          continue
        }
        if (expectedPatterns.some((regexp) => regexp.test(propertyName))) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (!output.valid) {
          return { valid: false }
        }
      }
      return { valid: true, schemaLocation, schemaKeyword: 'additionalProperties', instanceLocation }
    }
  } else {
    return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      if (!isJSONObject(instance)) {
        return { valid: true, schemaLocation, instanceLocation }
      }
      const validOutputs = new Map<string, Output>()
      const invalidPropertyNames = []
      const errors: InvalidVerboseOutput[] = []
      for (const [propertyName, propertyValue] of Object.entries(instance)) {
        if (expectedPropertyNames.includes(propertyName)) {
          continue
        }
        if (expectedPatterns.some((regexp) => regexp.test(propertyName))) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)

        if (output.valid) {
          validOutputs.set(propertyName, output)
        } else {
          if (failFast) {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'additionalProperties',
              instanceLocation,
              message: formatMessage([output as InvalidVerboseOutput], [propertyName]),
              details: [propertyName],
              errors: [output as InvalidVerboseOutput]
            }
          }
          invalidPropertyNames.push(propertyName)
          errors.push(output as InvalidVerboseOutput)
        }
      }
      if (errors.length === 0) {
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
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation,
          message: formatMessage(errors, invalidPropertyNames),
          errors
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
