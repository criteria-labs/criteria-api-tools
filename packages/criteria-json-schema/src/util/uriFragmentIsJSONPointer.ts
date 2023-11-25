import { isJSONPointer } from './JSONPointer'
import { splitFragment, URI } from './uri'

// filter out URIs that are a local identifier example.json#schema
export function uriFragmentIsJSONPointer(uri: URI): boolean {
  const { fragment } = splitFragment(uri)
  return typeof fragment === 'string' && isJSONPointer(fragment)
}
