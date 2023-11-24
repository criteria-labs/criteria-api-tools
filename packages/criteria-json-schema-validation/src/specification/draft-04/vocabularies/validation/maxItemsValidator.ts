import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONArray } from '../../../../util/isJSONArray'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maxItemsValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maxItems' in schema)) {
    return null
  }

  const maxItems = schema['maxItems']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      instance.length <= maxItems,
      maxItems === 1
        ? `should have up to 1 item but has ${instance.length} instead`
        : `should have up to ${maxItems} items but has ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxItems', instanceLocation }
    )
  }
}
