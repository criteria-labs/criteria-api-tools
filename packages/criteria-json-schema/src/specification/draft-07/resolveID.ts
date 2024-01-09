import { resolveURIReference } from '../../util/uri'
import { JSONSchema } from './JSONSchema'

export function resolveID(schema: JSONSchema, baseURI: string) {
  if (typeof schema !== 'object') {
    return undefined
  }

  // $ref prevents a sibling id from changing the base uri
  if ('$ref' in schema) {
    return undefined
  }

  if ('$id' in schema && typeof schema.$id === 'string') {
    // TODO?: do absolute and # fragemnt versions?
    return resolveURIReference(schema.$id, baseURI)
  }

  return undefined
}
