export function isJSONString(instance: unknown): instance is string {
  return typeof instance === 'string'
}
