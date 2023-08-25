export function isJSONArray(instance: unknown): instance is unknown[] {
  return Array.isArray(instance)
}
