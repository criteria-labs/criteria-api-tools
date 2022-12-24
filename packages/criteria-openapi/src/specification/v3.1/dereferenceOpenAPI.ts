import { evaluateJSONPointer } from '@criteria/json-pointer'
import { DereferencedOpenAPI, OpenAPI } from './types'

interface Options {
  retrieve?: (uri: string) => object
}

export function dereferenceOpenAPI(openAPI: OpenAPI, options?: Options): DereferencedOpenAPI {
  const retrieve =
    options?.retrieve ??
    ((uri: string) => {
      throw new Error(`Unsupported URI '${uri}'`)
    })
  const resolve = (uri: string) => {
    if (uri === '') {
      return '#'
    }
    if (uri.startsWith('#')) {
      return uri
    }
    throw new Error(`Unsupported URI '${uri}'`)
  }

  const evaluate = (uri: string) => {
    if (uri.startsWith('#')) {
      const jsonPointer = uri.slice(1)
      return evaluateJSONPointer(jsonPointer, openAPI)
    } else {
      return retrieve(uri)
    }
  }

  const valuesByURI = {}

  const dereferenceValue = (value: any, uri: string) => {
    if (typeof value === 'object') {
      // FIXME: Handle PathItem Object $ref fields, Link Object operationRef fields and ExampleObject externalValue fields
      if ('$ref' in value && typeof value.$ref === 'string') {
        return dereferenceURI(value.$ref)
      } else if (Array.isArray(value)) {
        return dereferenceArray(value, uri)
      } else {
        return dereferenceObject(value, uri)
      }
    }
    return value
  }

  const dereferenceArray = <T extends any[]>(array: T, uri: string) => {
    return array.map((value, index) => {
      return dereferenceValue(value, `${uri}/${index}`)
    })
  }

  const dereferenceObject = <T extends object>(object: T, uri: string) => {
    let result = valuesByURI[uri]
    if (result !== undefined) {
      return result
    }

    result = {}
    valuesByURI[uri] = result
    for (const key in object) {
      result[key] = dereferenceValue(object[key], `${uri}/${key}`)
    }
    return result
  }

  const dereferenceURI = (uri: string) => {
    const resolvedURI = resolve(uri)

    let result = valuesByURI[resolvedURI]
    if (result !== undefined) {
      return result
    }

    const value = evaluate(resolvedURI)
    return dereferenceValue(value, resolvedURI)
  }

  return dereferenceObject(openAPI, '#')
}
