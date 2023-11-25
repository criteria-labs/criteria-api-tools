import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function ifValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('if' in schema)) {
    return null
  }

  const schemaLocation = schemaPath.join('') as JSONPointer

  const trueValidator = (instance: unknown, instanceLocation: JSONPointer): Output => {
    return { valid: true, schemaLocation, instanceLocation }
  }

  const ifSchema = schema['if']
  const ifValidator = context.validatorForSchema(ifSchema, [...schemaPath, '/if'])

  const thenSchema = schema['then']
  const thenValidator =
    thenSchema !== undefined ? context.validatorForSchema(thenSchema, [...schemaPath, '/then']) : trueValidator

  const elseSchema = schema['else']
  const elseValidator =
    elseSchema !== undefined ? context.validatorForSchema(elseSchema, [...schemaPath, '/else']) : trueValidator

  return (instance: unknown, instanceLocation: JSONPointer): Output => {
    const ifOutput = ifValidator(instance, instanceLocation)
    if (ifOutput.valid) {
      const thenOutput = thenValidator(instance, instanceLocation)
      if (thenOutput.valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation,
          annotationResults: reduceAnnotationResults(ifOutput.annotationResults, thenOutput.annotationResults)
        }
      } else {
        return thenOutput
      }
    } else {
      const elseOutput = elseValidator(instance, instanceLocation)
      if (elseOutput.valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation,
          annotationResults: elseOutput.annotationResults
        }
      } else {
        return elseOutput
      }
    }
  }
}
