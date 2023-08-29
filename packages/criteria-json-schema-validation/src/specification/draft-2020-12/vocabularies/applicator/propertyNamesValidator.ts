import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { formatList } from '../../../../util/formatList'

export function propertyNamesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('propertyNames' in schema)) {
    return null
  }

  const propertyNames = schema['propertyNames']
  const validator = context.validatorForSchema(propertyNames, `${schemaLocation}/propertyNames`)
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const propertyName of Object.keys(instance)) {
      // property names don't have a path from the root
      const output = validator(propertyName, '')
      if (output.valid) {
        validOutputs[propertyName] = output
      } else {
        invalidOutputs[propertyName] = output as InvalidOutput
      }
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation
      }
    } else {
      const propertyNames = Object.keys(invalidOutputs)
      let message
      if (propertyNames.length === 1) {
        message = `Invalid property name ${propertyNames[0]}`
      } else {
        message = `Invalid property names ${formatList(propertyNames, 'and')}`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation,
        message,
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
