export function validateJSONPointer(value: string) {
  if (value !== '' && !value.startsWith('/')) {
    throw new Error('Invalid JSON pointer')
  }
}
