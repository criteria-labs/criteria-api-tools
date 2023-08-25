export function isJSONObject(instance: unknown): instance is object {
  return typeof instance === 'object' && instance !== null && !Array.isArray(instance)
}
