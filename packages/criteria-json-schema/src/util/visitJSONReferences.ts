import { JSONPointer } from './JSONPointer'
import { visitObjects } from './visitObjects'

export function isJSONReference(value: any): value is { $ref: string } {
  return typeof value === 'object' && '$ref' in value
}

export function visitJSONReferences<State extends object = {}>(
  value: any,
  initialState: State,
  visitor: (reference: { $ref: string }, location: JSONPointer, state: State) => boolean | void
) {
  let states = [initialState]
  visitObjects(value, (object, location, visitChildren) => {
    if (isJSONReference(object)) {
      if (typeof object.$ref === 'string') {
        const newState = { ...states[states.length - 1] }
        states.push(newState)
        visitor(object, location, newState)
        states.pop()
      }
    } else {
      visitChildren()
    }
  })
}
