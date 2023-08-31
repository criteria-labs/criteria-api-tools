import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { formatList } from '../../../../util/formatList'

export function unevaluatedPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('unevaluatedProperties' in schema)) {
    return null
  }

  const unevaluatedProperties = schema['unevaluatedProperties']
  const validator = context.validatorForSchema(unevaluatedProperties, `${schemaLocation}/unevaluatedProperties`)

  const failFast = context.failFast
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

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (evaluatedProperties.has(propertyName)) {
        continue
      }

      // unevaluated property
      const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
      if (output.valid) {
        validOutputs[propertyName] = output
      } else {
        invalidOutputs[propertyName] = output as InvalidOutput
      }

      if (!output.valid && failFast) {
        break
      }
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'unevaluatedProperties',
        instanceLocation,
        annotationResults: {
          unevaluatedProperties: Object.keys(validOutputs)
        }
      }
    } else {
      const entries: [string, InvalidOutput][] = Object.entries(invalidOutputs)
      let message
      if (entries.length === 1) {
        message = `has invalid property ('${entries[0][0]}' ${entries[0][1].message})`
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
        errors: Object.values(invalidOutputs)
      } as any
    }
  }
}
