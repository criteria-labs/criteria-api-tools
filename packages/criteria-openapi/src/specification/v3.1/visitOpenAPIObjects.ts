import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../../util/JSONPointer'
import {
  Callback,
  Components,
  Encoding,
  Example,
  Header,
  Link,
  MediaType,
  OpenAPI,
  Operation,
  Parameter,
  PathItem,
  Paths,
  Reference,
  RequestBody,
  Response,
  Schema,
  SecurityScheme
} from './types'

export type OpenAPIObjectType =
  | 'openapi'
  | 'operation'
  | 'schema'
  | 'response'
  | 'parameter'
  | 'example'
  | 'requestBody'
  | 'header'
  | 'securityScheme'
  | 'link'
  | 'callback'
  | 'pathItem'

export type OpenAPIObject<ReferenceType extends Reference | never> =
  | Operation<ReferenceType>
  | Schema<ReferenceType>
  | Response<ReferenceType>
  | Parameter<ReferenceType>
  | Example
  | RequestBody<ReferenceType>
  | Header<ReferenceType>
  | SecurityScheme
  | Link
  | Callback<ReferenceType>
  | PathItem<ReferenceType>
  | ReferenceType

function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null
}

function isArray(value: any): value is object {
  return typeof value === 'object' && value !== null && Array.isArray(value)
}

function appendJSONPointer(path: JSONPointer[], jsonPointer: JSONPointer): JSONPointer[] {
  return [...path.slice(0, -1), `${path[path.length - 1]}${jsonPointer}`]
}

function isReference(value: any): value is Reference {
  if (typeof value !== 'object') {
    return false
  }
  const { $ref, summary, description, ...rest } = value
  return typeof $ref === 'string' && Object.keys(rest).length === 0
}

export function visitOpenAPIObjects<ReferenceType extends Reference | never, State extends object = {}>(
  rootObject: any,
  rootObjectType: OpenAPIObjectType,
  initialState: State,
  visitor: (
    type: OpenAPIObjectType,
    object: OpenAPIObject<ReferenceType>,
    path: JSONPointer[],
    state: State
  ) => boolean | void
) {
  // detects circular references
  const seen = new WeakSet()

  const visitMap = <T>(
    map: Record<string, T>,
    path: JSONPointer[],
    states: State[],
    visitor: (element: T, path: JSONPointer[], states: State[]) => void
  ) => {
    if (!isObject(map)) {
      return false
    }
    for (const [key, value] of Object.entries(map)) {
      const stop = Boolean(visitor(value, appendJSONPointer(path, `/${escapeReferenceToken(key)}`), states))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitList = <T>(
    list: T[],
    path: JSONPointer[],
    states: State[],
    visitor: (element: T, path: JSONPointer[], states: State[]) => void
  ) => {
    if (!isArray(list)) {
      return false
    }
    for (let index = 0; index < list.length; index++) {
      const stop = Boolean(visitor(list[index], appendJSONPointer(path, `/${index}`), states))
      if (stop) {
        return true
      }
    }
    return false
  }

  const visitOpenAPI = (openapi: OpenAPI<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(openapi)) {
      return false
    }

    let stop = false

    if (!stop && openapi.paths) {
      stop = visitPaths(openapi.paths, states)
    }
    if (!stop && openapi.webhooks) {
      stop = visitMap(openapi.webhooks, ['/webhooks'], states, visitPathItem)
    }
    if (!stop && openapi.components) {
      stop = visitComponents(openapi.components, [...path, '/components'], states)
    }

    return stop
  }

  const visitPaths = (paths: Paths<ReferenceType>, states: State[]) => {
    if (!isObject(paths)) {
      return false
    }

    let stop = false

    for (const [key, pathItem] of Object.entries(paths)) {
      if (key.startsWith('/')) {
        stop = visitPathItem(pathItem, [`/paths/${escapeReferenceToken(key)}`], states)
        if (stop) {
          return true
        }
      }
    }

    return stop
  }

  const visitPathItem = (pathItem: PathItem<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(pathItem)) {
      return false
    }

    if (seen.has(pathItem)) {
      return false
    }
    seen.add(pathItem)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('pathItem', pathItem, path, newState))
    if (stop) {
      return true
    }

    if (isReference(pathItem)) {
      return false
    }

    if (!stop && pathItem.$ref && typeof pathItem.$ref === 'object') {
      stop = visitPathItem(pathItem.$ref, [...path, '/$ref'], states)
    }

    if (!stop && pathItem.get) {
      stop = visitOperation(pathItem.get, [...path, '/get'], states)
    }
    if (!stop && pathItem.put) {
      stop = visitOperation(pathItem.put, [...path, '/put'], states)
    }
    if (!stop && pathItem.post) {
      stop = visitOperation(pathItem.post, [...path, '/post'], states)
    }
    if (!stop && pathItem.delete) {
      stop = visitOperation(pathItem.delete, [...path, '/delete'], states)
    }
    if (!stop && pathItem.options) {
      stop = visitOperation(pathItem.options, [...path, '/options'], states)
    }
    if (!stop && pathItem.head) {
      stop = visitOperation(pathItem.head, [...path, '/head'], states)
    }
    if (!stop && pathItem.patch) {
      stop = visitOperation(pathItem.patch, [...path, '/patch'], states)
    }
    if (!stop && pathItem.trace) {
      stop = visitOperation(pathItem.trace, [...path, '/trace'], states)
    }

    if (!stop && pathItem.parameters) {
      stop = visitList(pathItem.parameters, [...path, '/parameters'], states, visitParameter)
    }

    return stop
  }

  const visitOperation = (
    operation: Operation<ReferenceType> | ReferenceType,
    path: JSONPointer[],
    states: State[]
  ) => {
    if (!isObject(operation)) {
      return false
    }

    if (seen.has(operation)) {
      return false
    }
    seen.add(operation)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('operation', operation, path, newState))
    if (stop) {
      return true
    }

    if (isReference(operation)) {
      return false
    }

    if (!stop && operation.parameters) {
      stop = visitList(operation.parameters, [...path, '/parameters'], states, visitParameter)
    }
    if (!stop && operation.requestBody) {
      stop = visitRequestBody(operation.requestBody, [...path, '/requestBody'], states)
    }
    if (!stop && operation.responses) {
      stop = visitMap(operation.responses, [...path, '/responses'], states, visitResponse)
    }
    if (!stop && operation.callbacks) {
      stop = visitMap(operation.callbacks, ['/callbacks'], states, visitPathItem)
    }

    return stop
  }

  const visitSchema = (schema: Schema<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(schema) && typeof schema !== 'boolean') {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    if (typeof schema === 'boolean') {
      return Boolean(visitor('schema', schema, path, newState))
    }

    if (seen.has(schema)) {
      return false
    }
    seen.add(schema)

    let stop = Boolean(visitor('schema', schema, path, newState))
    if (stop) {
      return true
    }

    if (isReference(schema)) {
      return false
    }

    // visit JSON Schema

    return stop
  }

  const visitResponse = (response: Response<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(response)) {
      return false
    }

    if (seen.has(response)) {
      return false
    }
    seen.add(response)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('response', response, path, newState))
    if (stop) {
      return true
    }

    if (isReference(response)) {
      return false
    }

    if (!stop && response.headers) {
      stop = visitMap(response.headers, [...path, '/headers'], states, visitHeader)
    }
    if (!stop && response.content) {
      stop = visitMap(response.content, [...path, '/content'], states, visitMediaType)
    }
    if (!stop && response.links) {
      stop = visitMap(response.links, [...path, '/links'], states, visitLink)
    }

    return stop
  }

  const visitParameter = (
    parameter: Parameter<ReferenceType> | ReferenceType,
    path: JSONPointer[],
    states: State[]
  ) => {
    if (!isObject(parameter)) {
      return false
    }

    if (seen.has(parameter)) {
      return false
    }
    seen.add(parameter)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('parameter', parameter, path, newState))
    if (stop) {
      return true
    }

    if (isReference(parameter)) {
      return false
    }

    if (!stop && parameter.schema !== undefined) {
      stop = visitSchema(parameter.schema, [...path, '/schema'], states)
    }
    if (!stop && parameter.examples) {
      stop = visitMap(parameter.examples, [...path, '/examples'], states, visitExample)
    }
    if (!stop && parameter.content) {
      stop = visitMap(parameter.content, [...path, '/content'], states, visitMediaType)
    }

    return stop
  }

  const visitExample = (example: Example | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(example)) {
      return false
    }

    if (seen.has(example)) {
      return false
    }
    seen.add(example)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('example', example, path, newState))
    if (stop) {
      return true
    }

    return stop
  }

  const visitRequestBody = (
    requestBody: RequestBody<ReferenceType> | ReferenceType,
    path: JSONPointer[],
    states: State[]
  ) => {
    if (!isObject(requestBody)) {
      return false
    }

    if (seen.has(requestBody)) {
      return false
    }
    seen.add(requestBody)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('requestBody', requestBody, path, newState))
    if (stop) {
      return true
    }

    if (isReference(requestBody)) {
      return false
    }

    if (!stop && requestBody.content) {
      stop = visitMap(requestBody.content, [...path, '/content'], states, visitMediaType)
    }

    return stop
  }

  const visitHeader = (header: Header<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(header)) {
      return false
    }

    if (seen.has(header)) {
      return false
    }
    seen.add(header)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('header', header, path, newState))
    if (stop) {
      return true
    }

    if (isReference(header)) {
      return false
    }

    if (!stop && header.schema !== undefined) {
      stop = visitSchema(header.schema, [...path, '/schema'], states)
    }
    if (!stop && header.examples) {
      stop = visitMap(header.examples, [...path, '/examples'], states, visitExample)
    }
    if (!stop && header.content) {
      stop = visitMap(header.content, [...path, '/content'], states, visitMediaType)
    }

    return stop
  }

  const visitSecurityScheme = (
    securityScheme: SecurityScheme | ReferenceType,
    path: JSONPointer[],
    states: State[]
  ) => {
    if (!isObject(securityScheme)) {
      return false
    }

    if (seen.has(securityScheme)) {
      return false
    }
    seen.add(securityScheme)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('securityScheme', securityScheme, path, newState))
    if (stop) {
      return true
    }

    return stop
  }

  const visitLink = (link: Link | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(link)) {
      return false
    }

    if (seen.has(link)) {
      return false
    }
    seen.add(link)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('link', link, path, newState))
    if (stop) {
      return true
    }

    return stop
  }

  const visitCallback = (callback: Callback<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(callback)) {
      return false
    }

    if (seen.has(callback)) {
      return false
    }
    seen.add(callback)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('callback', callback, path, newState))
    if (stop) {
      return true
    }

    if (isReference(callback)) {
      return false
    }

    for (const [key, pathItem] of Object.entries(callback)) {
      if (key.startsWith('/')) {
        stop = visitPathItem(pathItem, [...path, `/${escapeReferenceToken(key)}`], states)
      }
    }

    return stop
  }

  const visitComponents = (components: Components<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(components)) {
      return false
    }

    let stop = false
    if (!stop && components.schemas) {
      stop = visitMap(components.schemas, [...path, '/schemas'], states, visitSchema)
    }
    if (!stop && components.responses) {
      stop = visitMap(components.responses, [...path, '/responses'], states, visitResponse)
    }
    if (!stop && components.parameters) {
      stop = visitMap(components.parameters, [...path, '/parameters'], states, visitParameter)
    }
    if (!stop && components.examples) {
      stop = visitMap(components.examples, [...path, '/examples'], states, visitExample)
    }
    if (!stop && components.requestBodies) {
      stop = visitMap(components.requestBodies, [...path, '/requestBodies'], states, visitRequestBody)
    }
    if (!stop && components.headers) {
      stop = visitMap(components.headers, [...path, '/headers'], states, visitHeader)
    }
    if (!stop && components.securitySchemes) {
      stop = visitMap(components.securitySchemes, [...path, '/securitySchemes'], states, visitSecurityScheme)
    }
    if (!stop && components.links) {
      stop = visitMap(components.links, [...path, '/links'], states, visitLink)
    }
    if (!stop && components.callbacks) {
      stop = visitMap(components.callbacks, [...path, '/callbacks'], states, visitCallback)
    }
    if (!stop && components.pathItems) {
      stop = visitMap(components.pathItems, [...path, '/pathItems'], states, visitPathItem)
    }
    return stop
  }

  const visitMediaType = (mediaType: MediaType<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(mediaType)) {
      return false
    }

    let stop = false
    if (!stop && mediaType.encoding) {
      stop = visitMap(mediaType.encoding, [...path, '/encoding'], states, visitEncoding)
    }
    if (!stop && mediaType.examples) {
      stop = visitMap(mediaType.examples, [...path, '/examples'], states, visitExample)
    }
    if (!stop && mediaType.schema !== undefined) {
      stop = visitSchema(mediaType.schema, [...path, '/schema'], states)
    }
    return stop
  }

  const visitEncoding = (encoding: Encoding<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(encoding)) {
      return false
    }

    let stop = false
    if (!stop && encoding.headers) {
      stop = visitMap(encoding.headers, [...path, '/headers'], states, visitHeader)
    }
    return stop
  }

  switch (rootObjectType) {
    case 'openapi':
      return visitOpenAPI(rootObject, [''], [initialState])
    case 'operation':
      return visitOperation(rootObject, [''], [initialState])
    case 'schema':
      return visitSchema(rootObject, [''], [initialState])
    case 'response':
      return visitResponse(rootObject, [''], [initialState])
    case 'parameter':
      return visitParameter(rootObject, [''], [initialState])
    case 'example':
      return visitExample(rootObject, [''], [initialState])
    case 'requestBody':
      return visitRequestBody(rootObject, [''], [initialState])
    case 'header':
      return visitHeader(rootObject, [''], [initialState])
    case 'securityScheme':
      return visitSecurityScheme(rootObject, [''], [initialState])
    case 'link':
      return visitLink(rootObject, [''], [initialState])
    case 'callback':
      return visitCallback(rootObject, [''], [initialState])
    case 'pathItem':
      return visitPathItem(rootObject, [''], [initialState])
    default:
      const _: never = rootObjectType
  }
}
