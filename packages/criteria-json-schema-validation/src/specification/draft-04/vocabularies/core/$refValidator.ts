import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { ValidatorContext } from '../../../../validation/keywordValidators'

function isReference(schema: object): schema is { $ref: string } {
  return '$ref' in schema
}

export function $refValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!isReference(schema)) {
    return null
  }

  const $ref = schema['$ref']
  const dereferencedSchema = context.index.dereferenceReference($ref, schema, schemaPath)
  return context.validatorForSchema(dereferencedSchema, [...schemaPath, '/$ref'])
}
