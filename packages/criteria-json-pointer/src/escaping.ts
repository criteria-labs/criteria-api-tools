export function escapeReferenceToken(value: string): string {
  let result = value
  if (result.includes('~')) {
    result = result.replaceAll('~', '~0')
  }
  if (result.includes('/')) {
    result = result.replaceAll('/', '~1')
  }
  return result
}

export function unescapeReferenceToken(value: string): string {
  return value.replaceAll('~1', '/').replaceAll('~0', '~')
}
