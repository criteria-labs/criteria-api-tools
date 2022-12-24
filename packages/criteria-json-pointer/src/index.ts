function unescape(value: string): string {
  return value.replaceAll('~1', '/').replaceAll('~0', '~')
}

export function evaluateJSONPointer(jsonPointer: string, document: any): any {
  if (jsonPointer === '') {
    return document
  }
  if (!jsonPointer.startsWith('/')) {
    throw new Error(`Invalid JSON pointer '${jsonPointer}'`)
  }
  const referenceTokens = jsonPointer.slice(1).split('/')
  let value = document
  for (const referenceToken of referenceTokens) {
    value = value[unescape(referenceToken)]
  }
  return value
}
