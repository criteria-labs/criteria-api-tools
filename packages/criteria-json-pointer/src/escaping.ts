export function escapeReferenceToken(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1')
}

export function unescapeReferenceToken(value: string): string {
  return value.replaceAll('~1', '/').replaceAll('~0', '~')
}
