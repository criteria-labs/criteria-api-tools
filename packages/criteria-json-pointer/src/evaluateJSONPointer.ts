import { unescapeReferenceToken } from './escaping'
import { validateJSONPointer } from './validateJSONPointer'

export function evaluateJSONPointer(jsonPointer: string, document: any): any {
  validateJSONPointer(jsonPointer)

  if (jsonPointer === '') {
    return document
  }
  const referenceTokens = jsonPointer.slice(1).split('/')
  let value = document
  for (const referenceToken of referenceTokens) {
    value = value && value[unescapeReferenceToken(referenceToken)]
  }
  return value
}
