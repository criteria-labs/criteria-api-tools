export type JSONPointer = '' | `/${string}`

export function isJSONPointer(string: string): string is JSONPointer {
  return string === '' || string.startsWith('/')
}
