import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { InvalidOutput, Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function unevaluatedPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('unevaluatedProperties' in schema)) {
    return null
  }

  const unevaluatedProperties = schema['unevaluatedProperties']
  const validator = context.validatorForSchema(unevaluatedProperties, `${schemaLocation}/unevaluatedProperties`)

  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const propertiesAnnotationResult = instanceContext.annotationResultForKeyword('properties')
    const patternPropertiesAnnotationResults = instanceContext.annotationResultForKeyword('patternProperties')
    const additionalPropertiesAnnotationResult = instanceContext.annotationResultForKeyword('additionalProperties')
    const unevaluatedPropertiesAnnotationResult = instanceContext.annotationResultForKeyword('unevaluatedProperties')

    const evaluatedProperties = new Set([
      ...(propertiesAnnotationResult ?? []),
      ...(patternPropertiesAnnotationResults ?? []),
      ...(additionalPropertiesAnnotationResult ?? []),
      ...(unevaluatedPropertiesAnnotationResult ?? [])
    ])

    const outputs: { [name: string]: Output } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (evaluatedProperties.has(propertyName)) {
        continue
      }

      // unevaluated property
      const output = validator(
        propertyValue,
        instanceContext.appendingInstanceLocation(`/${escapeReferenceToken(propertyName)}`)
      )
      outputs[propertyName] = output

      if (!output.valid && failFast) {
        break
      }
    }

    const invalidOutputs = Object.values(outputs).filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'unevaluatedProperties',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          additionalProperties: Object.keys(outputs)
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'unevaluatedProperties',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      } as any
    }
  }
}
