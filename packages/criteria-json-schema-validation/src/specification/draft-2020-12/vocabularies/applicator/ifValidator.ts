import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { Output, ValidVerboseOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function ifValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('if' in schema)) {
    return null
  }

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer

  const trueValidator = (instance: unknown, instanceLocation: JSONPointer): Output => {
    return { valid: true, schemaLocation, instanceLocation }
  }

  const ifSchema = schema['if']
  const ifValidator = context.validatorForSchema(ifSchema, [...schemaPath, '/if'])

  const thenSchema = schema['then']
  const thenValidator: BoundValidator | null =
    thenSchema !== undefined ? context.validatorForSchema(thenSchema, [...schemaPath, '/then']) : trueValidator

  const elseSchema = schema['else']
  const elseValidator: BoundValidator | null =
    elseSchema !== undefined ? context.validatorForSchema(elseSchema, [...schemaPath, '/else']) : trueValidator

  return (instance: unknown, instanceLocation: JSONPointer): Output => {
    const ifOutput = ifValidator(instance, instanceLocation)
    if (ifOutput.valid) {
      const thenOutput = thenValidator(instance, instanceLocation)
      if (thenOutput.valid) {
        if (thenValidator === null) {
          return {
            valid: true,
            schemaLocation,
            instanceLocation,
            annotationResults: (ifOutput as ValidVerboseOutput).annotationResults
          }
        }
        return {
          valid: true,
          schemaLocation,
          instanceLocation,
          annotationResults: reduceAnnotationResults(
            (ifOutput as ValidVerboseOutput).annotationResults,
            (thenOutput as ValidVerboseOutput).annotationResults ?? {}
          )
        }
      } else {
        return thenOutput
      }
    } else {
      if (elseValidator === null) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation
        }
      }
      const elseOutput = elseValidator(instance, instanceLocation)
      if (elseOutput.valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation,
          annotationResults: (elseOutput as ValidVerboseOutput).annotationResults
        }
      } else {
        return elseOutput
      }
    }
  }
}
