import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { InvalidOutput, Output } from '../../output'
import { Validator } from '../../types'
import { ValidationContext } from '../ValidationContext'
import { InstanceContext } from '../InstanceContext'

export function propertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('properties' in schema)) {
    return null
  }

  const properties = schema['properties']
  const propertyValidators: [string, Validator][] = Object.keys(properties).map((propertyName) => {
    const subschema = properties[propertyName]
    const subschemaValidator = context.validatorForSchema(
      subschema,
      `${schemaLocation}/properties/${escapeReferenceToken(propertyName)}`
    )
    return [propertyName, subschemaValidator]
  })

  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const outputs: { [name: string]: Output } = {}
    for (const [propertyName, subschemaValidator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = subschemaValidator(
        instance[propertyName],
        instanceContext.appendingInstanceLocation(`/${escapeReferenceToken(propertyName)}`)
      )
      outputs[propertyName] = output

      if (!output.valid && failFast) {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'properties',
          instanceLocation: instanceContext.instanceLocation,
          errors: [output as InvalidOutput]
        }
      }
    }

    const invalidOutputs = Object.values(outputs).filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          properties: Object.keys(outputs)
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}
