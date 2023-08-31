export function reduceAnnotationResults(lhs: Record<string, any>, rhs: Record<string, any>) {
  let result: Record<string, any> = {}
  const {
    properties: lhsProperties,
    patternProperties: lhsPatternProperties,
    additionalProperties: lhsAdditionalProperties,
    unevaluatedProperties: lhsUnevaluatedProperties,
    items: lhsItems,
    prefixItems: lhsPrefixItems,
    contains: lhsContains,
    unevaluatedItems: lhsUnevaluatedItems,
    ...lhsRest
  } = lhs ?? {}
  const {
    properties: rhsProperties,
    patternProperties: rhsPatternProperties,
    additionalProperties: rhsAdditionalProperties,
    unevaluatedProperties: rhsUnevaluatedProperties,
    items: rhsItems,
    prefixItems: rhsPrefixItems,
    contains: rhsContains,
    unevaluatedItems: rhsUnevaluatedItems,
    ...rhsRest
  } = rhs ?? {}
  result = {
    ...lhsRest,
    ...rhsRest,
    properties: reducePropertiesAnnotationResults(lhsProperties, rhsProperties),
    patternProperties: reducePropertiesAnnotationResults(lhsPatternProperties, rhsPatternProperties),
    additionalProperties: reducePropertiesAnnotationResults(lhsAdditionalProperties, rhsAdditionalProperties),
    unevaluatedProperties: reducePropertiesAnnotationResults(lhsUnevaluatedProperties, rhsUnevaluatedProperties),
    items: reduceItemsAnnotationResults(lhsItems, rhsItems),
    prefixItems: reduceItemsAnnotationResults(lhsPrefixItems, rhsPrefixItems),
    contains: reduceContainsAnnotationResults(lhsContains, rhsContains),
    unevaluatedItems: reduceItemsAnnotationResults(lhsUnevaluatedItems, rhsUnevaluatedItems)
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

function reduceContainsAnnotationResults(lhs: string[] | undefined, rhs: string[] | undefined) {
  if (lhs !== undefined || rhs !== undefined) {
    return Array.from(new Set([...(lhs ?? []), ...(rhs ?? [])]))
  }
  return undefined
}
