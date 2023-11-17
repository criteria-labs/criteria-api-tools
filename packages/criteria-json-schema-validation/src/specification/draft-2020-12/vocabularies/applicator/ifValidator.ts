import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function ifValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('if' in schema)) {
    return null
  }

  const trueValidator = (instance: unknown, instanceLocation: JSONPointer): Output => {
    return { valid: true, schemaLocation, instanceLocation }
  }

  const ifSchema = schema['if']
  const ifValidator = context.validatorForSchema(ifSchema, `${schemaLocation}/if`)

  const thenSchema = schema['then']
  const thenValidator =
    thenSchema !== undefined ? context.validatorForSchema(thenSchema, `${schemaLocation}/then`) : trueValidator

  const elseSchema = schema['else']
  const elseValidator =
    elseSchema !== undefined ? context.validatorForSchema(elseSchema, `${schemaLocation}/else`) : trueValidator

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
