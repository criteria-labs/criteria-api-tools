import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../util/JSONPointer'
import { Output } from './output'

export function assert(
  condition: any,
  message: string,
  {
    schemaLocation,
    schemaKeyword,
    instanceLocation
  }: {
    schemaLocation: JSONPointer
    schemaKeyword?: keyof DereferencedJSONSchemaObjectDraft2020_12
    instanceLocation: JSONPointer
  }
): Output {
  if (condition) {
    return {
      valid: true
    }
  }
  return {
    valid: false,
    schemaLocation,
    schemaKeyword,
    instanceLocation,
    error: message
  }
}
