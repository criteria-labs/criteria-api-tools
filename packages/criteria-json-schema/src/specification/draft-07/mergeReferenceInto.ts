export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export function mergeReferenceInto(
  target: object,
  referencedSchema: object,
  siblings: object,
  policy: ReferenceMergePolicy
) {
  switch (policy) {
    case 'by_keyword': {
      // Reapply siblings so that referencedSchema does not override sibling properties
      Object.assign(target, referencedSchema, siblings)
      break
    }
    case 'overwrite':
      // Ignore siblings
      Object.assign(target, referencedSchema)
      break
    case 'none':
      // none is not valid for Draft 04 schemas, same effect as overwite
      Object.assign(target, referencedSchema)
      break
    case 'default':
    default: {
      // default is to merge
      Object.assign(target, referencedSchema, siblings)
      break
    }
  }
}
