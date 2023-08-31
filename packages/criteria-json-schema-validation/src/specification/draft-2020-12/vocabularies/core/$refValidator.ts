import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function $refValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('$ref' in schema)) {
    return null
  }

  const $ref = schema['$ref']
  const validator = context.validatorForSchema($ref, `${schemaLocation}/$ref`)
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    return validator(instance, instanceLocation)
  }
}
