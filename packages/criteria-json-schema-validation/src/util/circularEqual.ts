/**
 * Compares two values for equality where either value may contain circular references.
 */
export default function circularEqual(lhs: any, rhs: any): boolean {
  var seen = new Set()

  const compareValues = (lhs: any, rhs: any) => {
    if (typeof lhs === 'object' && lhs !== null && !ArrayBuffer.isView(lhs)) {
      if (seen.has(lhs)) {
        return true
      }
      seen.add(lhs)

      if (!(typeof rhs === 'object' && rhs !== null && !ArrayBuffer.isView(rhs))) {
        return false
      }

      if (Array.isArray(lhs)) {
        return Array.isArray(rhs) && compareArrays(lhs, rhs)
      } else {
        return compareObjects(lhs, rhs)
      }
    } else {
      return Object.is(lhs, rhs)
    }
  }

  const compareObjects = (lhs: object, rhs: object) => {
    if (JSON.stringify(Object.keys(lhs).sort()) !== JSON.stringify(Object.keys(rhs).sort())) {
      return false
    }
    for (const key of Object.keys(lhs)) {
      const equal = compareValues(lhs[key], rhs[key])
      if (!equal) {
        return false
      }
    }
    return true
  }

  const compareArrays = (lhs: any[], rhs: any[]) => {
    if (lhs.length !== rhs.length) {
      return false
    }
    for (const index in lhs) {
      const equal = compareValues(lhs[index], rhs[index])
      if (!equal) {
        return false
      }
    }
    return true
  }

  return compareValues(lhs, rhs)
}
