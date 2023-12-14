import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../../util/JSONPointer'
import { JSONSchema } from './JSONSchema'
import { visitObjects } from '../../util/visitObjects'

export function isSubschema(jsonPointer: JSONPointer) {
  return (
    jsonPointer === '' ||
    Boolean(jsonPointer.match(/^\/\$defs\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/)) ||
    Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/)) ||
    Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/)) ||
    jsonPointer === '/not' ||
    jsonPointer === '/if' ||
    jsonPointer === '/then' ||
    jsonPointer === '/else' ||
    Boolean(jsonPointer.match(/^\/dependentSchemas\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/prefixItems\/[\d]+$/)) ||
    jsonPointer === '/items' ||
    jsonPointer === '/contains' ||
    Boolean(jsonPointer.match(/^\/properties\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/patternProperties\/[^/]*$/)) ||
    jsonPointer === '/additionalProperties' ||
    jsonPointer === '/propertyNames' ||
    jsonPointer === '/unevaluatedItems' ||
    jsonPointer === '/unevaluatedProperties' ||
    jsonPointer === '/contentSchema' ||
    // deprecated but still supported, TODO: verify
    jsonPointer === '/additionalItems' ||
    Boolean(jsonPointer.match(/^\/definitions\/[^/]*$/)) ||
    Boolean(jsonPointer.match(/^\/dependencies\/[^/]*$/))
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

  const visitSubschema = (subschema: JSONSchema, path: JSONPointer[], states: State[]): boolean => {
    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    if (typeof subschema === 'boolean') {
      return Boolean(visitor(subschema, path, newState))
    }

    if (seen.has(subschema)) {
      return false
    }
    seen.add(subschema)

    let stop = Boolean(visitor(subschema, path, newState))
    if (stop) {
      return true
    }

    // TODO: get metaschema before recursing into keywords
    const {
      $defs,
      $ref,
      $dynamicRef,
      allOf,
      anyOf,
      oneOf,
      not,
      if: ifSchema,
      then: thenSchema,
      else: elseSchema,
      dependentSchemas,
      prefixItems,
      items,
      contains,
      properties,
      patternProperties,
      additionalProperties,
      propertyNames,
      unevaluatedItems,
      unevaluatedProperties,
      contentSchema,
      ...restWithDeprecated
    } = subschema

    if (!stop && $defs !== undefined) {
      stop = visitMap($defs, [...path, '/$defs'], states)
    }
    if (!stop && $ref !== undefined && typeof $ref === 'object') {
      stop = visitSubschema($ref, [...path, '/$ref'], states)
    }
    if (!stop && $dynamicRef !== undefined && typeof $dynamicRef === 'object') {
      stop = visitSubschema($dynamicRef, [...path, '/$dynamicRef'], states)
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
    if (!stop && ifSchema !== undefined) {
      stop = visitSubschema(ifSchema, [...path, '/if'], states)
    }
    if (!stop && thenSchema !== undefined) {
      stop = visitSubschema(thenSchema, [...path, '/then'], states)
    }
    if (!stop && elseSchema !== undefined) {
      stop = visitSubschema(elseSchema, [...path, '/else'], states)
    }
    if (!stop && dependentSchemas !== undefined) {
      stop = visitMap(dependentSchemas, [...path, '/dependentSchemas'], states)
    }
    if (!stop && prefixItems !== undefined) {
      stop = visitList(prefixItems, [...path, '/prefixItems'], states)
    }
    if (!stop && items !== undefined) {
      stop = visitSubschema(items, [...path, '/items'], states)
    }
    if (!stop && contains !== undefined) {
      stop = visitSubschema(contains, [...path, '/contains'], states)
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
    if (!stop && propertyNames !== undefined) {
      stop = visitSubschema(propertyNames, [...path, '/propertyNames'], states)
    }
    if (!stop && unevaluatedItems !== undefined) {
      stop = visitSubschema(unevaluatedItems, [...path, '/unevaluatedItems'], states)
    }
    if (!stop && unevaluatedProperties !== undefined) {
      stop = visitSubschema(unevaluatedProperties, [...path, '/unevaluatedProperties'], states)
    }
    if (!stop && contentSchema !== undefined) {
      stop = visitSubschema(contentSchema, [...path, '/contentSchema'], states)
    }

    // deprecated but still supported, TODO: verify
    const { additionalItems, definitions, dependencies, ...rest } = restWithDeprecated as any

    if (!stop && additionalItems !== undefined) {
      stop = visitSubschema(additionalItems, [...path, '/additionalItems'], states)
    }
    if (!stop && definitions !== undefined) {
      stop = visitMap(definitions, [...path, '/definitions'], states)
    }
    if (!stop && dependencies !== undefined) {
      stop = visitMap(dependencies, [...path, '/dependencies'], states)
    }

    return stop
  }

  visitSubschema(document, [''], [initialState])
}

export function isPlainKeyword(keyword: string) {
  if (keyword.startsWith('$')) {
    return false
  }
  if (
    [
      'allOf',
      'anyOf',
      'oneOf',
      'not',
      'if',
      'then',
      'else',
      'dependentSchemas',
      'prefixItems',
      'items',
      'contains',
      'properties',
      'patternProperties',
      'additionalProperties',
      'propertyNames',
      'unevaluatedItems',
      'unevaluatedProperties',
      'contentSchema'
    ].includes(keyword)
  ) {
    return false
  }
  return true
}
