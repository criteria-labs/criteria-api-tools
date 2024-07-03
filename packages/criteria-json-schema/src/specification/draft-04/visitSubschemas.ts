import { escapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from './JSONSchema'

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
