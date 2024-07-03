export type JSONPointer = '' | `/${string}`

export function isJSONPointer(value: unknown): value is JSONPointer {
  return typeof value === 'string' && (value === '' || value.startsWith('/'))
}
