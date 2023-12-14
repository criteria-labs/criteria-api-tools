import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

function isDynamicReference(schema: object): schema is { $dynamicRef: string } {
  return '$dynamicRef' in schema
}

export function $dynamicRefValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!isDynamicReference(schema)) {
    return null
  }

  const $dynamicRef = schema['$dynamicRef']
  const dereferencedSchema = context.index.dereferenceDynamicReference($dynamicRef, schema, schemaPath)
  const validator = context.validatorForSchema(dereferencedSchema, [...schemaPath, '/$dynamicRef'])
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    return validator(instance, instanceLocation)
  }
}
