export function isJSONNumber(instance: unknown): instance is number {
  return typeof instance === 'number'
}
