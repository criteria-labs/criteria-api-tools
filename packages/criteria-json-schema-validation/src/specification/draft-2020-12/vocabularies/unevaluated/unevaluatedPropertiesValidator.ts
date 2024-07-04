import type { JSONPointer } from '@criteria/json-pointer'
import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, InvalidVerboseOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function unevaluatedPropertiesValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('unevaluatedProperties' in schema)) {
    return null
  }

  const unevaluatedProperties = schema['unevaluatedProperties']
  const validator = context.validatorForSchema(unevaluatedProperties, [...schemaPath, '/unevaluatedProperties'])

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const propertiesAnnotationResult = annotationResults['properties']
    const patternPropertiesAnnotationResults = annotationResults['patternProperties']
    const additionalPropertiesAnnotationResult = annotationResults['additionalProperties']
    const unevaluatedPropertiesAnnotationResult = annotationResults['unevaluatedProperties']

    const evaluatedProperties = new Set([
      ...(propertiesAnnotationResult ?? []),
      ...(patternPropertiesAnnotationResults ?? []),
      ...(additionalPropertiesAnnotationResult ?? []),
      ...(unevaluatedPropertiesAnnotationResult ?? [])
    ])

    let validOutputs = new Map<string, ValidOutput>()
    const invalidPropertyNames: string[] = []
    const errors: InvalidOutput[] = []
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (evaluatedProperties.has(propertyName)) {
        continue
      }

      // unevaluated property
      const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
      if (!output.valid && failFast) {
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'unevaluatedProperties',
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

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'unevaluatedProperties',
        instanceLocation,
        annotationResults: {
          unevaluatedProperties: Array.from(validOutputs.keys())
        }
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'unevaluatedProperties',
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
