import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { Output, combineAnnotationResults } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

const trueValidator = (instance: unknown, instanceContext: InstanceContext): Output => {
  return { valid: true }
}

export function ifValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('if' in schema)) {
    return null
  }

  const ifSchema = schema['if']
  const ifValidator = context.validatorForSchema(ifSchema, `${schemaLocation}/if`)
  const thenSchema = schema['then']
  const thenValidator =
    thenSchema !== undefined ? context.validatorForSchema(thenSchema, `${schemaLocation}/then`) : trueValidator
  const elseSchema = schema['else']
  const elseValidator =
    elseSchema !== undefined ? context.validatorForSchema(elseSchema, `${schemaLocation}/else`) : trueValidator
  return (instance: unknown, instanceContext: InstanceContext): Output => {
    const ifOutput = ifValidator(instance, instanceContext.clone())
    if (ifOutput.valid) {
      const thenOutput = thenValidator(instance, instanceContext.clone())
      if (thenOutput.valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation: instanceContext.instanceLocation,
          annotationResults: {
            ...combineAnnotationResults([ifOutput.annotationResults ?? {}, thenOutput.annotationResults ?? {}]),
            ifOutput
          }
        } as any
      } else {
        return thenOutput
      }
    } else {
      const elseOutput = elseValidator(instance, instanceContext.clone())
      if (elseOutput.valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation: instanceContext.instanceLocation,
          annotationResults: combineAnnotationResults([elseOutput.annotationResults ?? {}])
        } as any
      } else {
        elseOutput
      }
    }
  }
}
