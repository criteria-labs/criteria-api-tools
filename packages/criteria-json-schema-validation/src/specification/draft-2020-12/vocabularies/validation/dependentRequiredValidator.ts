import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'

export function dependentRequiredValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('dependentRequired' in schema)) {
    return null
  }

  const dependentRequired = schema['dependentRequired']

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, dependencies] of Object.entries(dependentRequired)) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const missingProperties = []
      for (const dependency of dependencies) {
        if (!instance.hasOwnProperty(dependency)) {
          missingProperties.push(dependency)
        }
      }

      const output = assert(
        missingProperties.length === 0,
        `is mising ${formatList(
          missingProperties.map((missingProperty) => `'${missingProperty}'`),
          'and'
        )}`,
        { schemaLocation, schemaKeyword: 'dependentRequired', instanceLocation }
      )
      if (output.valid) {
        validOutputs[propertyName] = output
      } else {
        invalidOutputs[propertyName] = output as InvalidOutput
      }

      if (!output.valid && failFast) {
        return output
      }
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentRequired',
        instanceLocation
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'dependentRequired',
        instanceLocation,
        message: formatList(
          Object.values(invalidOutputs).map((output) => output.message),
          'and'
        ),
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
