export function reduceAnnotationResults(lhs: Record<string, any>, rhs: Record<string, any>) {
  let result: Record<string, any> = {}
  const {
    properties: lhsProperties,
    patternProperties: lhsPatternProperties,
    additionalProperties: lhsAdditionalProperties,
    items: lhsItems,
    additionalItems: lhsAdditionalItems,
    ...lhsRest
  } = lhs ?? {}
  const {
    properties: rhsProperties,
    patternProperties: rhsPatternProperties,
    additionalProperties: rhsAdditionalProperties,
    items: rhsItems,
    additionalItems: rhsAdditionalItems,
    ...rhsRest
  } = rhs ?? {}
  result = {
    ...lhsRest,
    ...rhsRest,
    properties: reducePropertiesAnnotationResults(lhsProperties, rhsProperties),
    patternProperties: reducePropertiesAnnotationResults(lhsPatternProperties, rhsPatternProperties),
    additionalProperties: reducePropertiesAnnotationResults(lhsAdditionalProperties, rhsAdditionalProperties),
    items: reduceItemsAnnotationResults(lhsItems, rhsItems),
    additionalItems: reduceItemsAnnotationResults(lhsAdditionalItems, rhsAdditionalItems)
  }
  return result
}

function reducePropertiesAnnotationResults(lhs: string[] | undefined, rhs: string[] | undefined) {
  if (lhs !== undefined || rhs !== undefined) {
    return [...(lhs ?? []), ...(rhs ?? [])]
  }
  return undefined
}

function reduceItemsAnnotationResults(lhs: true | number | undefined, rhs: true | number | undefined) {
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
