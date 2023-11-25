import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from './JSONPointer'

export function visitObjects(
  value: any,
  visitor: (object: object, location: JSONPointer, visitChildren: () => void) => boolean | void
) {
  // detects circular references
  const seen = new WeakSet()
  const visitObject = (object: object, location: JSONPointer) => {
    if (seen.has(object)) {
      return
    }
    seen.add(object)

    visitor(object, location, () => {
      for (const [key, value] of Object.entries(object)) {
        visitValue(value, `${location}/${escapeReferenceToken(key)}`)
      }
    })
  }
  const visitValue = (value: any, location: JSONPointer) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      if (Array.isArray(value)) {
        value.forEach((element, index) => visitValue(element, `${location}/${index}`))
      } else {
        visitObject(value, location)
      }
    }
  }
  visitValue(value, '')
}
