import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function $refValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('$ref' in schema)) {
    return null
  }

  if (typeof schema['$ref'] === 'string') {
    throw new Error(`string $ref ${JSON.stringify(schema)}`)
  }

  const $ref = schema['$ref']
  const validator = context.validatorForSchema($ref, `${schemaLocation}/$ref`)
  return (instance: any, instanceContext: InstanceContext): Output => {
    return validator(instance, instanceContext)
  }
}
