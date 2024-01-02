import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import {
  InvalidOutput,
  InvalidVerboseOutput,
  Output,
  ValidOutput,
  ValidVerboseOutput
} from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function dependentSchemasValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('dependentSchemas' in schema)) {
    return null
  }

  const dependentSchemas = schema['dependentSchemas']

  const propertyValidators: [string, BoundValidator][] = Object.entries(dependentSchemas).map(
    ([propertyName, subschema]) => {
      const subschemaValidator = context.validatorForSchema(subschema, [
        ...schemaPath,
        `/dependentSchemas/${escapeReferenceToken(propertyName)}`
      ])

      return [propertyName, subschemaValidator]
    }
  )

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    const invalidPropertyNames: string[] = []
    const errors: InvalidOutput[] = []
    for (const [propertyName, validator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = validator(instance, instanceLocation)
      if (!output.valid && failFast) {
        if (outputFormat === 'flag') {
          return { valid: false }
        } else {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'dependentSchemas',
            instanceLocation,
            message: `is invalid against dependent schema of property '${propertyName}'`,
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
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        annotationResults: Array.from(validOutputs.values())
          .map((output) => (output as ValidVerboseOutput).annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'dependentSchemas',
          instanceLocation,
          message: `is invalid against dependent schemas of properties ${formatList(
            invalidPropertyNames.map((propertyName) => `'${propertyName}'`),
            'and'
          )}`,
          errors: errors as InvalidVerboseOutput[]
        }
      }
    }
  }
}
