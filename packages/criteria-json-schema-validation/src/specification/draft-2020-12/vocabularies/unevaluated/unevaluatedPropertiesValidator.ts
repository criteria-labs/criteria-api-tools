import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
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
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (evaluatedProperties.has(propertyName)) {
        continue
      }

      // unevaluated property
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
        schemaKeyword: 'unevaluatedProperties',
        instanceLocation,
        message,
        errors: Array.from(invalidOutputs.values())
      } as any
    }
  }
}
