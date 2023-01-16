import { evaluateJSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '../JSONSchema'
import { visitValues } from './visitors/visitValues'

export function evaluateFragment(fragment: string, document: any): JSONSchema | undefined {
  if (typeof document !== 'object') {
    throw new Error('document is not an object')
  }
  if (fragment === '' || fragment.startsWith('/')) {
    return evaluateJSONPointer(fragment, document)
  } else {
    let found
    visitValues(document, null, (value, kind, context) => {
      if (kind === 'schema' && (value as JSONSchema).id === `#${encodeURIComponent(fragment)}`) {
        found = value
        return true // stop
      }
    })
    return found
  }
}
