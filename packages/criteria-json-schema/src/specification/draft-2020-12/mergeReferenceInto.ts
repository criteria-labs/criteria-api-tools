export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export function mergeReferenceInto(
  target: object,
  referencedSchema: object,
  siblings: object,
  policy: ReferenceMergePolicy
) {
  const mergeReferencedSchemaByKeyword = () => {
    Object.assign(target, siblings)

    // This implementation will either merge referencedSchema's keywords alongside target,
    // unless there is a conflict between keywords (with some exceptions).
    // If there is a conflict, then referencedSchema will remain under the $ref keyword,
    // but dereferenced.
    // This assumes that all keywords are independent and don't interact with each other.
    const targetKeywords = Object.keys(target)
    const referencedKeywords = Object.keys(referencedSchema).filter((keyword) => {
      // $id doesn't count as a conflict if we're going to merge the referenced schema
      if (keyword === '$id') {
        return false
      }
      // $defs doesn't count as a conflict if we're going to merge the referenced schema
      if (keyword === '$defs' || keyword === 'definitions') {
        return false
      }
      // keyword doesn't count as a conflict if they are the same value
      if (referencedSchema[keyword] === target[keyword]) {
        return false
      }
      return true
    })
    const hasConflictingKeywords = targetKeywords.some((keyword) => referencedKeywords.includes(keyword))
    if (hasConflictingKeywords) {
      target['$ref'] = referencedSchema
    } else {
      // Since no keywords appear in both, merge schemas into one as in draft 04.
      const { ...siblings } = target
      Object.assign(target, referencedSchema, siblings)
    }
  }
  switch (policy) {
    case 'by_keyword':
      mergeReferencedSchemaByKeyword()
      break
    case 'overwrite':
      // ignore siblings
      Object.assign(target, referencedSchema)
      break
    case 'none':
      Object.assign(target, siblings)
      target['$ref'] = referencedSchema
      break
    case 'default':
    default:
      mergeReferencedSchemaByKeyword()
      break
  }
}
