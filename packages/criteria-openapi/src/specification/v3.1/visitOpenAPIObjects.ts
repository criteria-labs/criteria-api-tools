import { escapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import {
  Callback,
  Components,
  Encoding,
  Example,
  Header,
  Info,
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
  SecurityScheme,
  type Contact,
  type Discriminator,
  type ExternalDocumentation,
  type License,
  type OAuthFlow,
  type OAuthFlows,
  type Responses,
  type SecurityRequirement,
  type Server,
  type ServerVariable,
  type Tag,
  type XML
} from './types'

export type OpenAPIObjectType =
  | 'OpenAPI'
  | 'Info'
  | 'Contact'
  | 'License'
  | 'Server'
  | 'ServerVariable'
  | 'Components'
  | 'Paths'
  | 'PathItem'
  | 'Operation'
  | 'ExternalDocumentation'
  | 'Parameter'
  | 'RequestBody'
  | 'MediaType'
  | 'Encoding'
  | 'Responses'
  | 'Response'
  | 'Callback'
  | 'Example'
  | 'Link'
  | 'Header'
  | 'Tag'
  | 'Reference'
  | 'Schema'
  | 'Discriminator'
  | 'XML'
  | 'SecurityScheme'
  | 'OAuthFlows'
  | 'OAuthFlow'
  | 'SecurityRequirement'

export type OpenAPIObject<ReferenceType extends Reference | never> =
  | Info
  | Contact
  | License
  | Server
  | ServerVariable
  | Components<ReferenceType>
  | Paths<ReferenceType>
  | PathItem<ReferenceType>
  | Operation<ReferenceType>
  | ExternalDocumentation
  | Parameter<ReferenceType>
  | RequestBody<ReferenceType>
  | MediaType<ReferenceType>
  | Encoding<ReferenceType>
  | Responses<ReferenceType>
  | Response<ReferenceType>
  | Callback<ReferenceType>
  | Example
  | Link
  | Header<ReferenceType>
  | Tag
  | ReferenceType
  | Schema<ReferenceType>
  | Discriminator
  | XML
  | SecurityScheme
  | OAuthFlows
  | OAuthFlow
  | SecurityRequirement
  | OpenAPI<ReferenceType>

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

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('OpenAPI', openapi, path, newState))
    if (stop) {
      return true
    }

    if (!stop && openapi.info) {
      stop = visitInfo(openapi.info, [...path, '/info'], states)
    }
    if (!stop && openapi.servers) {
      stop = visitList(openapi.servers, [...path, '/servers'], states, visitServer)
    }
    if (!stop && openapi.paths) {
      stop = visitPaths(openapi.paths, [...path, '/paths'], states)
    }
    if (!stop && openapi.webhooks) {
      stop = visitMap(openapi.webhooks, [...path, '/webhooks'], states, visitPathItem)
    }
    if (!stop && openapi.components) {
      stop = visitComponents(openapi.components, [...path, '/components'], states)
    }
    if (!stop && openapi.security) {
      stop = visitList(openapi.security, [...path, '/security'], states, visitSecurityRequirement)
    }
    if (!stop && openapi.tags) {
      stop = visitList(openapi.tags, [...path, '/tags'], states, visitTag)
    }
    if (!stop && openapi.externalDocs) {
      stop = visitExternalDocumentation(openapi.externalDocs, [...path, '/externalDocs'], states)
    }

    return stop
  }

  const visitInfo = (info: Info, path: JSONPointer[], states: State[]) => {
    if (!isObject(info)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Info', info, path, newState))
    if (stop) {
      return true
    }

    if (!stop && info.contact) {
      stop = visitContact(info.contact, [...path, '/contact'], states)
    }
    if (!stop && info.license) {
      stop = visitLicense(info.license, [...path, '/license'], states)
    }

    return stop
  }

  const visitContact = (contact: Contact, path: JSONPointer[], states: State[]) => {
    if (!isObject(contact)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('Contact', contact, path, newState))
  }

  const visitLicense = (license: License, path: JSONPointer[], states: State[]) => {
    if (!isObject(license)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('License', license, path, newState))
  }

  const visitServer = (server: Server, path: JSONPointer[], states: State[]) => {
    if (!isObject(server)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Server', server, path, newState))
    if (stop) {
      return true
    }

    if (!stop && server.variables) {
      stop = visitMap(server.variables, [...path, '/variables'], states, visitServerVariable)
    }

    return stop
  }

  const visitServerVariable = (serverVariable: ServerVariable, path: JSONPointer[], states: State[]) => {
    if (!isObject(serverVariable)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('ServerVariable', serverVariable, path, newState))
  }

  const visitComponents = (components: Components<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(components)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Components', components, path, newState))
    if (stop) {
      return true
    }

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

  const visitPaths = (paths: Paths<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(paths)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Paths', paths, path, newState))
    if (stop) {
      return true
    }

    for (const [key, pathItem] of Object.entries(paths)) {
      if (key.startsWith('/')) {
        stop = visitPathItem(pathItem, [...path, `/${escapeReferenceToken(key)}`], states)
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

    if (isReference(pathItem)) {
      return Boolean(visitor('PathItem', pathItem, path, newState))
    }

    let stop = Boolean(visitor('PathItem', pathItem, path, newState))
    if (stop) {
      return true
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

    if (isReference(operation)) {
      return Boolean(visitor('Operation', operation, path, newState))
    }

    let stop = Boolean(visitor('Operation', operation, path, newState))
    if (stop) {
      return true
    }

    if (!stop && operation.externalDocs) {
      stop = visitExternalDocumentation(operation.externalDocs, [...path, '/externalDocs'], states)
    }
    if (!stop && operation.parameters) {
      stop = visitList(operation.parameters, [...path, '/parameters'], states, visitParameter)
    }
    if (!stop && operation.requestBody) {
      stop = visitRequestBody(operation.requestBody, [...path, '/requestBody'], states)
    }
    if (!stop && operation.responses) {
      stop = visitResponses(operation.responses, [...path, '/responses'], states)
    }
    if (!stop && operation.callbacks) {
      stop = visitMap(operation.callbacks, [...path, '/callbacks'], states, visitPathItem)
    }
    if (!stop && operation.security) {
      stop = visitList(operation.security, [...path, '/security'], states, visitSecurityRequirement)
    }
    if (!stop && operation.servers) {
      stop = visitList(operation.servers, [...path, '/servers'], states, visitServer)
    }

    return stop
  }

  const visitExternalDocumentation = (
    externalDocumentation: ExternalDocumentation,
    path: JSONPointer[],
    states: State[]
  ) => {
    if (!isObject(externalDocumentation)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('ExternalDocumentation', externalDocumentation, path, newState))
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

    if (isReference(parameter)) {
      return Boolean(visitor('Parameter', parameter, path, newState))
    }

    let stop = Boolean(visitor('Parameter', parameter, path, newState))
    if (stop) {
      return true
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

    if (isReference(requestBody)) {
      return Boolean(visitor('RequestBody', requestBody, path, newState))
    }

    let stop = Boolean(visitor('RequestBody', requestBody, path, newState))
    if (stop) {
      return true
    }

    if (!stop && requestBody.content) {
      stop = visitMap(requestBody.content, [...path, '/content'], states, visitMediaType)
    }

    return stop
  }

  const visitMediaType = (mediaType: MediaType<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(mediaType)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('MediaType', mediaType, path, newState))
    if (stop) {
      return true
    }

    if (!stop && mediaType.schema !== undefined) {
      stop = visitSchema(mediaType.schema, [...path, '/schema'], states)
    }
    if (!stop && mediaType.examples) {
      stop = visitMap(mediaType.examples, [...path, '/examples'], states, visitExample)
    }
    if (!stop && mediaType.encoding) {
      stop = visitMap(mediaType.encoding, [...path, '/encoding'], states, visitEncoding)
    }

    return stop
  }

  const visitEncoding = (encoding: Encoding<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(encoding)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Encoding', encoding, path, newState))
    if (stop) {
      return true
    }

    if (!stop && encoding.headers) {
      stop = visitMap(encoding.headers, [...path, '/headers'], states, visitHeader)
    }

    return stop
  }

  const visitResponses = (responses: Responses<ReferenceType>, path: JSONPointer[], states: State[]) => {
    if (!isObject(responses)) {
      return false
    }

    if (seen.has(responses)) {
      return false
    }
    seen.add(responses)

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Responses', responses, path, newState))
    if (stop) {
      return true
    }

    if (!stop && responses.default) {
      stop = visitResponse(responses.default, [...path, '/headerdefaults'], states)
    }
    for (const [statusCode, response] of Object.entries(responses)) {
      if (/^[1-5](?:\d{2}|XX)$/.test(statusCode)) {
        stop = visitResponse(response, [...path, `/${statusCode}`], states)
        if (stop) {
          return true
        }
      }
    }

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

    if (isReference(response)) {
      return Boolean(visitor('Response', response, path, newState))
    }

    let stop = Boolean(visitor('Response', response, path, newState))
    if (stop) {
      return true
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

    if (isReference(callback)) {
      return Boolean(visitor('Callback', callback, path, newState))
    }

    let stop = Boolean(visitor('Callback', callback, path, newState))
    if (stop) {
      return true
    }

    for (const [key, pathItem] of Object.entries(callback)) {
      if (key.startsWith('/')) {
        stop = visitPathItem(pathItem, [...path, `/${escapeReferenceToken(key)}`], states)
      }
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

    if (isReference(example)) {
      return Boolean(visitor('Example', example, path, newState))
    }

    return Boolean(visitor('Example', example, path, newState))
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

    if (isReference(link)) {
      return Boolean(visitor('Link', link, path, newState))
    }

    let stop = Boolean(visitor('Link', link, path, newState))
    if (stop) {
      return true
    }

    if (!stop && link.server) {
      stop = visitServer(link.server, [...path, '/links'], states)
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

    if (isReference(header)) {
      return Boolean(visitor('Header', header, path, newState))
    }

    let stop = Boolean(visitor('Header', header, path, newState))
    if (stop) {
      return true
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

  const visitTag = (tag: Tag, path: JSONPointer[], states: State[]) => {
    if (!isObject(tag)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('Tag', tag, path, newState))
    if (stop) {
      return true
    }

    if (!stop && tag.externalDocs) {
      stop = visitExternalDocumentation(tag.externalDocs, [...path, '/content'], states)
    }

    return stop
  }

  const visitReference = (reference: ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(reference)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('Reference', reference, path, newState))
  }

  const visitSchema = (schema: Schema<ReferenceType> | ReferenceType, path: JSONPointer[], states: State[]) => {
    if (!isObject(schema) && typeof schema !== 'boolean') {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    if (typeof schema === 'boolean') {
      return Boolean(visitor('Schema', schema, path, newState))
    }

    if (isReference(schema)) {
      return Boolean(visitor('Schema', schema, path, newState))
    }

    if (seen.has(schema)) {
      return false
    }
    seen.add(schema)

    let stop = Boolean(visitor('Schema', schema, path, newState))
    if (stop) {
      return true
    }

    if (!stop && schema.discriminator) {
      visitDiscriminator(schema.discriminator, [...path, '/discriminator'], states)
    }
    if (!stop && schema.xml) {
      visitXML(schema.xml, [...path, '/xml'], states)
    }
    if (!stop && schema.externalDocs) {
      visitExternalDocumentation(schema.externalDocs, [...path, '/externalDocs'], states)
    }

    return stop
  }

  const visitDiscriminator = (discriminator: Discriminator, path: JSONPointer[], states: State[]) => {
    if (!isObject(discriminator)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('Discriminator', discriminator, path, newState))
  }

  const visitXML = (xml: XML, path: JSONPointer[], states: State[]) => {
    if (!isObject(xml)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('XML', xml, path, newState))
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

    if (isReference(securityScheme)) {
      return Boolean(visitor('SecurityScheme', securityScheme, path, newState))
    }

    let stop = Boolean(visitor('SecurityScheme', securityScheme, path, newState))
    if (stop) {
      return true
    }

    if (securityScheme.type === 'oauth2') {
      if (!stop && securityScheme.flows) {
        visitOAuthFlows(securityScheme.flows, [...path, '/flows'], states)
      }
    }

    return stop
  }

  const visitOAuthFlows = (oAuthFlows: OAuthFlows, path: JSONPointer[], states: State[]) => {
    if (!isObject(oAuthFlows)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    let stop = Boolean(visitor('OAuthFlows', oAuthFlows, path, newState))
    if (stop) {
      return true
    }

    if (!stop && oAuthFlows.implicit) {
      visitOAuthFlow(oAuthFlows.implicit, [...path, '/implicit'], states)
    }
    if (!stop && oAuthFlows.password) {
      visitOAuthFlow(oAuthFlows.password, [...path, '/password'], states)
    }
    if (!stop && oAuthFlows.clientCredentials) {
      visitOAuthFlow(oAuthFlows.clientCredentials, [...path, '/clientCredentials'], states)
    }
    if (!stop && oAuthFlows.authorizationCode) {
      visitOAuthFlow(oAuthFlows.authorizationCode, [...path, '/authorizationCode'], states)
    }

    return stop
  }

  const visitOAuthFlow = (oAuthFlow: OAuthFlow, path: JSONPointer[], states: State[]) => {
    if (!isObject(oAuthFlow)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('OAuthFlow', oAuthFlow, path, newState))
  }

  const visitSecurityRequirement = (securityRequirement: SecurityRequirement, path: JSONPointer[], states: State[]) => {
    if (!isObject(securityRequirement)) {
      return false
    }

    const newState = { ...states[states.length - 1] }
    states = [...states, newState]

    return Boolean(visitor('SecurityRequirement', securityRequirement, path, newState))
  }

  switch (rootObjectType) {
    case 'OpenAPI':
      return visitOpenAPI(rootObject, [''], [initialState])
    case 'Info':
      return visitInfo(rootObject, [''], [initialState])
    case 'Contact':
      return visitContact(rootObject, [''], [initialState])
    case 'License':
      return visitLicense(rootObject, [''], [initialState])
    case 'Server':
      return visitServer(rootObject, [''], [initialState])
    case 'ServerVariable':
      return visitServerVariable(rootObject, [''], [initialState])
    case 'Components':
      return visitComponents(rootObject, [''], [initialState])
    case 'Paths':
      return visitPaths(rootObject, [''], [initialState])
    case 'PathItem':
      return visitPathItem(rootObject, [''], [initialState])
    case 'Operation':
      return visitOperation(rootObject, [''], [initialState])
    case 'ExternalDocumentation':
      return visitExternalDocumentation(rootObject, [''], [initialState])
    case 'Parameter':
      return visitParameter(rootObject, [''], [initialState])
    case 'RequestBody':
      return visitRequestBody(rootObject, [''], [initialState])
    case 'MediaType':
      return visitMediaType(rootObject, [''], [initialState])
    case 'Encoding':
      return visitEncoding(rootObject, [''], [initialState])
    case 'Responses':
      return visitResponses(rootObject, [''], [initialState])
    case 'Response':
      return visitResponse(rootObject, [''], [initialState])
    case 'Callback':
      return visitCallback(rootObject, [''], [initialState])
    case 'Example':
      return visitExample(rootObject, [''], [initialState])
    case 'Link':
      return visitLink(rootObject, [''], [initialState])
    case 'Header':
      return visitHeader(rootObject, [''], [initialState])
    case 'Tag':
      return visitTag(rootObject, [''], [initialState])
    case 'Reference':
      return visitReference(rootObject, [''], [initialState])
    case 'Schema':
      return visitSchema(rootObject, [''], [initialState])
    case 'Discriminator':
      return visitDiscriminator(rootObject, [''], [initialState])
    case 'XML':
      return visitXML(rootObject, [''], [initialState])
    case 'SecurityScheme':
      return visitSecurityScheme(rootObject, [''], [initialState])
    case 'OAuthFlows':
      return visitOAuthFlows(rootObject, [''], [initialState])
    case 'OAuthFlow':
      return visitOAuthFlow(rootObject, [''], [initialState])
    case 'SecurityRequirement':
      return visitSecurityRequirement(rootObject, [''], [initialState])
    default:
      const _: never = rootObjectType
  }
}
