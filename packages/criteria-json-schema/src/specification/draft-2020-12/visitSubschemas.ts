import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../../util/JSONPointer'
import { JSONSchema } from './JSONSchema'

function isSubschema(jsonPointer: JSONPointer) {
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

export function visitSubschemas(
  document: JSONSchema,
  isSubschema: (location: JSONPointer) => boolean,
  visitor: (subschema: JSONSchema, path: JSONPointer[]) => boolean | void
) {
  // detects circular references
  const seen = new WeakSet()

  const visitMap = (map: Record<string, JSONSchema>, path: JSONPointer[]) => {
    for (const [key, subschema] of Object.entries(map)) {
      const stop = Boolean(visitSubschema(subschema, appendJSONPointer(path, `/${escapeReferenceToken(key)}`)))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitList = (list: JSONSchema[], path: JSONPointer[]) => {
    for (let index = 0; index < list.length; index++) {
      const stop = Boolean(visitSubschema(list[index], appendJSONPointer(path, `/${index}`)))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitSubschema = (subschema: JSONSchema, path: JSONPointer[]): boolean => {
    if (typeof subschema === 'boolean') {
      return Boolean(visitor(subschema, path))
    }

    if (seen.has(subschema)) {
      return false
    }
    seen.add(subschema)

    let stop = Boolean(visitor(subschema, path))
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
      stop = visitMap($defs, [...path, '/$defs'])
    }
    if (!stop && $ref !== undefined && typeof $ref === 'object') {
      stop = visitSubschema($ref, [...path, '/$ref'])
    }
    if (!stop && $dynamicRef !== undefined && typeof $dynamicRef === 'object') {
      stop = visitSubschema($dynamicRef, [...path, '/$dynamicRef'])
    }
    if (!stop && allOf !== undefined) {
      stop = visitList(allOf, [...path, '/allOf'])
    }
    if (!stop && anyOf !== undefined) {
      stop = visitList(anyOf, [...path, '/anyOf'])
    }
    if (!stop && oneOf !== undefined) {
      stop = visitList(oneOf, [...path, '/oneOf'])
    }
    if (!stop && not !== undefined) {
      stop = visitSubschema(not, [...path, '/not'])
    }
    if (!stop && ifSchema !== undefined) {
      stop = visitSubschema(ifSchema, [...path, '/if'])
    }
    if (!stop && thenSchema !== undefined) {
      stop = visitSubschema(thenSchema, [...path, '/then'])
    }
    if (!stop && elseSchema !== undefined) {
      stop = visitSubschema(elseSchema, [...path, '/else'])
    }
    if (!stop && dependentSchemas !== undefined) {
      stop = visitMap(dependentSchemas, [...path, '/dependentSchemas'])
    }
    if (!stop && prefixItems !== undefined) {
      stop = visitList(prefixItems, [...path, '/prefixItems'])
    }
    if (!stop && items !== undefined) {
      stop = visitSubschema(items, [...path, '/items'])
    }
    if (!stop && contains !== undefined) {
      stop = visitSubschema(contains, [...path, '/contains'])
    }
    if (!stop && properties !== undefined) {
      stop = visitMap(properties, [...path, '/properties'])
    }
    if (!stop && patternProperties !== undefined) {
      stop = visitMap(patternProperties, [...path, '/patternProperties'])
    }
    if (!stop && additionalProperties !== undefined) {
      stop = visitSubschema(additionalProperties, [...path, '/additionalProperties'])
    }
    if (!stop && propertyNames !== undefined) {
      stop = visitSubschema(propertyNames, [...path, '/propertyNames'])
    }
    if (!stop && unevaluatedItems !== undefined) {
      stop = visitSubschema(unevaluatedItems, [...path, '/unevaluatedItems'])
    }
    if (!stop && unevaluatedProperties !== undefined) {
      stop = visitSubschema(unevaluatedProperties, [...path, '/unevaluatedProperties'])
    }
    if (!stop && contentSchema !== undefined) {
      stop = visitSubschema(contentSchema, [...path, '/contentSchema'])
    }

    // deprecated but still supported, TODO: verify
    const { additionalItems, definitions, dependencies, ...rest } = restWithDeprecated as any

    if (!stop && additionalItems !== undefined) {
      stop = visitSubschema(additionalItems, [...path, '/additionalItems'])
    }
    if (!stop && definitions !== undefined) {
      stop = visitMap(definitions, [...path, '/definitions'])
    }
    if (!stop && dependencies !== undefined) {
      stop = visitMap(dependencies, [...path, '/dependencies'])
    }

    return stop
  }

  if (isSubschema('')) {
    visitSubschema(document, [''])
  } else {
    if (typeof document === 'object' && document !== null && !ArrayBuffer.isView(document)) {
      if (Array.isArray(document)) {
        for (let index = 0; index < document.length; index++) {
          if (isSubschema(`/${index}`)) {
            visitSubschema(document[index], [`/${index}`])
          }
        }
      } else {
        for (const key in document) {
          if (isSubschema(`/${escapeReferenceToken(key)}`)) {
            visitSubschema(document[key], [`/${escapeReferenceToken(key)}`])
          }
        }
      }
    }
  }
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
