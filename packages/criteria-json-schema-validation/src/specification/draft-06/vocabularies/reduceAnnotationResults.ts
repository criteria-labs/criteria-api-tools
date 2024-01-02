export function reduceAnnotationResults(lhs: Record<string, any>, rhs: Record<string, any>) {
  const { properties, patternProperties, additionalProperties, items, additionalItems, contains, ...rest } = rhs
  const result = Object.assign({}, lhs, rest)
  if (properties !== undefined) {
    if (result.properties !== undefined) {
      result.properties.push(...properties)
    } else {
      result.properties = properties
    }
  }
  if (patternProperties !== undefined) {
    if (result.patternProperties !== undefined) {
      result.patternProperties.push(...patternProperties)
    } else {
      result.patternProperties = patternProperties
    }
  }
  if (additionalProperties !== undefined) {
    if (result.additionalProperties !== undefined) {
      result.additionalProperties.push(...additionalProperties)
    } else {
      result.additionalProperties = additionalProperties
    }
  }
  if (items !== undefined) {
    if (result.items !== undefined) {
      result.items = reduceItems(result.items, items)
    } else {
      result.items = items
    }
  }
  if (additionalItems !== undefined) {
    if (result.additionalItems !== undefined) {
      result.additionalItems = reduceItems(result.additionalItems, additionalItems)
    } else {
      result.additionalItems = additionalItems
    }
  }
  if (contains !== undefined) {
    if (result.contains !== undefined) {
      result.contains = Array.from(new Set([...result.contains, ...contains]))
    } else {
      result.contains = contains
    }
  }
  return result
}

function reduceItems(lhs: true | number | undefined, rhs: true | number | undefined) {
  if (lhs === true) {
    return true
  }
  if (rhs === true) {
    return true
  }
  if (typeof lhs === 'number' && typeof rhs === 'number') {
    return Math.max(lhs, rhs)
  }
  if (typeof lhs === 'number') {
    return lhs
  }
  if (typeof rhs === 'number') {
    return rhs
  }
  return undefined
}
