import { resolveURIReference } from '../../util/uri'
import { JSONSchema } from './JSONSchema'

export function resolveBaseURI(schema: JSONSchema, baseURI: string) {
  if (typeof schema === 'object' && '$id' in schema && typeof schema.$id === 'string') {
    // TODO?: do absolute and # fragemnt versions?
    return resolveURIReference(schema.$id, baseURI)
  }
  return baseURI
}
