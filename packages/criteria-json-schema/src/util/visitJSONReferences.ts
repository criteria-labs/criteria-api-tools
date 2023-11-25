import { JSONPointer } from './JSONPointer'
import { visitObjects } from './visitObjects'

export function isJSONReference(value: any): value is { $ref: string } {
  return typeof value === 'object' && '$ref' in value
}

export function visitJSONReferences(
  value: any,
  visitor: (reference: { $ref: string }, location: JSONPointer) => boolean | void
) {
  visitObjects(value, (object, location, visitChildren) => {
    if (isJSONReference(object)) {
      if (typeof object.$ref === 'string') {
        visitor(object, location)
      }
    } else {
      visitChildren()
    }
  })
}
