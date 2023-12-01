export function format(instance: any) {
  if (typeof instance === 'string') {
    return `'${instance}'`
  }
  if (typeof instance === 'object') {
    try {
      return JSON.stringify(instance)
    } catch {
      return `${instance}`
    }
  }
  return `${instance}`
}
