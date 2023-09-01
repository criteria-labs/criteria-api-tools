import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { reduceAnnotationResults } from '../reduceAnnotationResults'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { BoundValidator } from '../../../../validation/BoundValidator'

export function dependentSchemasValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('dependentSchemas' in schema)) {
    return null
  }

  const dependentSchemas = schema['dependentSchemas']

  const propertyValidators: [string, BoundValidator][] = Object.entries(dependentSchemas).map(
    ([propertyName, subschema]) => {
      const subschemaValidator = context.validatorForSchema(
        subschema,
        `${schemaLocation}/dependentSchemas/${escapeReferenceToken(propertyName)}`
      )

      return [propertyName, subschemaValidator]
    }
  )

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, validator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = validator(instance, instanceLocation)
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }

      if (!output.valid && failFast) {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'dependentSchemas',
          instanceLocation,
          message: `${(output as InvalidOutput).message} when '${propertyName}' is defined`,
          errors: [output as InvalidOutput]
        }
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        annotationResults: Array.from(validOutputs.values())
          .map((output) => output.annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        message: formatList(
          Array.from(invalidOutputs.values()).map((output) => output.message),
          'and'
        ),
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
