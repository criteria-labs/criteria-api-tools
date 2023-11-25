import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function $refValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('$ref' in schema)) {
    return null
  }

  const $ref = schema['$ref']
  const dereferencedSchema = context.index.dereferenceReference($ref, schema, schemaPath)
  const validator = context.validatorForSchema(dereferencedSchema, [...schemaPath, '/$ref'])
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    return validator(instance, instanceLocation)
  }
}
