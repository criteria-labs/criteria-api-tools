import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../../util/JSONPointer'
import { JSONSchema } from './JSONSchema'
import { visitObjects } from '../../util/visitObjects'

export function isSubschema(jsonPointer: JSONPointer) {
  return (
    jsonPointer === '' ||
    jsonPointer === '/additionalItems' ||
    jsonPointer === '/items' ||
    Boolean(jsonPointer.match(/^\/items\/[\d]+$/)) ||
    Boolean(jsonPointer.match(/^\/properties\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/patternProperties\/[^/]*$/)) ||
    jsonPointer === '/additionalProperties' ||
    Boolean(jsonPointer.match(/^\/dependencies\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/)) ||
    Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/)) ||
    Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/)) ||
    jsonPointer === '/not' ||
    Boolean(jsonPointer.match(/^\/definitions\/[^/]*$/))
  )
}

function appendJSONPointer(path: JSONPointer[], jsonPointer: JSONPointer): JSONPointer[] {
  return [...path.slice(0, -1), `${path[path.length - 1]}${jsonPointer}`]
}

export function visitSubschemas<State extends object = {}>(
  document: JSONSchema,
  initialState: State,
  visitor: (subschema: JSONSchema, path: JSONPointer[], state: State) => boolean | void
) {
  // detects circular references
  const seen = new WeakSet()

  const visitMap = (map: Record<string, JSONSchema>, path: JSONPointer[], states: State[]) => {
    if ('$ref' in map && Object.keys(map).length === 1 && typeof map['$ref'] === 'string') {
      // technically invalid JSON Schema
      return
    }
    for (const [key, subschema] of Object.entries(map)) {
      const stop = Boolean(visitSubschema(subschema, appendJSONPointer(path, `/${escapeReferenceToken(key)}`), states))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitList = (list: JSONSchema[], path: JSONPointer[], states: State[]) => {
    for (let index = 0; index < list.length; index++) {
      const stop = Boolean(visitSubschema(list[index], appendJSONPointer(path, `/${index}`), states))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitSubschema = (subschema: JSONSchema | boolean, path: JSONPointer[], states: State[]): boolean => {
    if (typeof subschema === 'boolean') {
      return false
    }

    if (seen.has(subschema)) {
      return false
    }
    seen.add(subschema)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor(subschema, path, newState))
    if (stop) {
      return true
    }

    // TODO: get metaschema before recursing into keywords
    const {
      additionalItems,
      items, // schema or array
      properties,
      patternProperties,
      additionalProperties,
      dependencies,
      allOf,
      anyOf,
      oneOf,
      not,
      definitions,
      ...rest
    } = subschema

    if (!stop && additionalItems !== undefined) {
      stop = visitSubschema(additionalItems, [...path, '/additionalItems'], states)
    }
    if (!stop && items !== undefined) {
      if (Array.isArray(items)) {
        stop = visitList(items, [...path, '/items'], states)
      } else {
        stop = visitSubschema(items, [...path, '/items'], states)
      }
    }
    if (!stop && properties !== undefined) {
      stop = visitMap(properties, [...path, '/properties'], states)
    }
    if (!stop && patternProperties !== undefined) {
      stop = visitMap(patternProperties, [...path, '/patternProperties'], states)
    }
    if (!stop && additionalProperties !== undefined) {
      stop = visitSubschema(additionalProperties, [...path, '/additionalProperties'], states)
    }
    if (!stop && dependencies !== undefined) {
      for (const [key, subschema] of Object.entries(dependencies)) {
        if (typeof subschema === 'object') {
          stop = Boolean(visitSubschema(subschema, [...path, `/dependencies/${escapeReferenceToken(key)}`], states))
          if (stop) {
            break
          }
        }
      }
    }
    if (!stop && allOf !== undefined) {
      stop = visitList(allOf, [...path, '/allOf'], states)
    }
    if (!stop && anyOf !== undefined) {
      stop = visitList(anyOf, [...path, '/anyOf'], states)
    }
    if (!stop && oneOf !== undefined) {
      stop = visitList(oneOf, [...path, '/oneOf'], states)
    }
    if (!stop && not !== undefined) {
      stop = visitSubschema(not, [...path, '/not'], states)
    }
    if (!stop && definitions !== undefined) {
      stop = visitMap(definitions, [...path, '/definitions'], states)
    }

    return stop
  }

  visitSubschema(document, [''], [initialState])
}

export function visitReferences(object: object, visitor: (parent, key) => void) {
  // detects circular references
  const seen = new WeakSet()
  const visitObject = (parent: any, key: string | number, object: object, location: JSONPointer) => {
    if (seen.has(object)) {
      return
    }
    seen.add(object)
    if ('$ref' in object && typeof object['$ref'] === 'string' && Object.keys(object).length === 1) {
      visitor(object['$ref'], location)
    } else {
      for (const [key, value] of Object.entries(object)) {
        visitValue(object, key, value, `${location}/${escapeReferenceToken(key)}`)
      }
    }
  }
  const visitValue = (parent: any, key: string | number, value: any, location: JSONPointer) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      if (Array.isArray(value)) {
        value.forEach((element, index) => visitValue(value, index, element, `${location}/${index}`))
      } else {
        visitObject(parent, key, value, location)
      }
    }
  }
  visitValue(object, null, object, '')
}

export function isPlainKeyword(keyword: string) {
  if (keyword.startsWith('$')) {
    return false
  }
  if (
    [
      'id',
      'additionalItems',
      'items',
      'properties',
      'patternProperties',
      'additionalProperties',
      'dependencies',
      'allOf',
      'oneOf',
      'not',
      'definitions'
    ].includes(keyword)
  ) {
    return false
  }
  return true
}
