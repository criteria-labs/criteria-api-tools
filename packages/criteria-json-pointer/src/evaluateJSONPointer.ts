import { validateJSONPointer } from './validateJSONPointer'

function unescapeReferenceToken(value: string): string {
  return value.replaceAll('~1', '/').replaceAll('~0', '~')
}

export function evaluateJSONPointer(jsonPointer: string, document: any): any {
  validateJSONPointer(jsonPointer)

  if (jsonPointer === '') {
    return document
  }
  const referenceTokens = jsonPointer.slice(1).split('/')
  let value = document
  for (const referenceToken of referenceTokens) {
    value = value[unescapeReferenceToken(referenceToken)]
  }
  return value
}
