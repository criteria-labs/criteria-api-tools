import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../util/JSONPointer'

export type AnnotationResultsByKeyword = {
  [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]?: any
}

export function combineAnnotationResults(results: AnnotationResultsByKeyword[]): AnnotationResultsByKeyword {
  const combineItems = (lhs: true | number | undefined, rhs: true | number | undefined) => {
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

  let combined: AnnotationResultsByKeyword = {}
  for (const result of results) {
    combined = {
      ...combined,
      ...result,
      properties: [...(combined.properties ?? []), ...(result.properties ?? [])],
      patternProperties: [...(combined.patternProperties ?? []), ...(result.patternProperties ?? [])],
      additionalProperties: [...(combined.additionalProperties ?? []), ...(result.additionalProperties ?? [])],
      unevaluatedProperties: [...(combined.unevaluatedProperties ?? []), ...(result.unevaluatedProperties ?? [])],
      items: combineItems(combined.items, result.items),
      prefixItems: combineItems(combined.prefixItems, result.prefixItems),
      contains: Array.from(new Set([...(combined.contains ?? []), ...(result.contains ?? [])])),
      unevaluatedItems: combineItems(combined.unevaluatedItems, result.unevaluatedItems)
    } as any
  }
  return combined
}

export type ValidOutput =
  | {
      valid: true
      annotationResults?: AnnotationResultsByKeyword
    }
  | {
      valid: true
      schemaLocation: JSONPointer
      schemaKeyword: keyof DereferencedJSONSchemaObjectDraft2020_12
      instanceLocation: JSONPointer
      annotationResults?: AnnotationResultsByKeyword
    }

export type InvalidOutput =
  | {
      valid: false
      schemaLocation: JSONPointer
      schemaKeyword: keyof DereferencedJSONSchemaObjectDraft2020_12 | null
      instanceLocation: JSONPointer
      error: string
    }
  | {
      valid: false
      schemaLocation: JSONPointer
      schemaKeyword: keyof DereferencedJSONSchemaObjectDraft2020_12 | null
      instanceLocation: JSONPointer
      errors: InvalidOutput[]
    }
  | {
      valid: false
      errors: InvalidOutput[]
    }

export type Output = ValidOutput | InvalidOutput
