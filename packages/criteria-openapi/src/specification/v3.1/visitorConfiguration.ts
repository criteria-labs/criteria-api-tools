import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context, ObjectType } from '../../visitors/Context'
import { VisitorConfiguration } from '../../visitors/visitValues'

export interface Options {
  jsonSchemaDialect?: string
  mergeAdditionalProperties?: (dereferencedObject: object, additionalProperties: object) => void
}

// TODO: Is options necessary as well as jsonSchemaDialect?
// What happens if a schema with a $schema references one without, does it default to the referring schema's dialect,
// or the jsonSchemaDialect value of the overall OpenAPI document?
const jsonSchemaDraft04VisitorConfiguration = (options: Options): VisitorConfiguration => ({
  jsonSchemaDialect: 'http://json-schema.org/draft-04/schema#',
  objectType: (context: Context): ObjectType | null => {
    const jsonPointer = context.jsonPointerFromObject
    if (
      context.objectType === 'schema' &&
      (jsonPointer === '' ||
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
        Boolean(jsonPointer.match(/^\/definitions\/[^/]*$/)))
    ) {
      return 'schema'
    }
    return null
  },
  resolveContext: (context: Context, object: object): Context => {
    // Assume that object is a Schema object
    let resolvedConfiguration = context.configuration
    if (context.objectType === 'schema') {
      let $schema: string | undefined
      if ('$schema' in object && typeof object.$schema === 'string') {
        $schema = object.$schema
      } else {
        $schema = options?.jsonSchemaDialect ?? 'https://spec.openapis.org/oas/3.1/dialect/base'
      }
      switch ($schema) {
        case 'https://spec.openapis.org/oas/3.1/dialect/base':
          resolvedConfiguration = configuration(options)
          break
        case 'http://json-schema.org/draft-04/schema#':
          resolvedConfiguration = jsonSchemaDraft04VisitorConfiguration(options)
          break
        case 'https://json-schema.org/draft/2020-12/schema':
          resolvedConfiguration = jsonSchemaDraft2020_12VisitorConfiguration(options)
          break
        default:
          // Warn that $schema not recognized
          resolvedConfiguration = context.configuration
          break
      }
    }

    let id: string | undefined
    if (context.objectType === 'schema' && 'id' in object && typeof object.id === 'string') {
      id = resolveURIReference(object.id, context.baseURI)
    }

    // XXX: Does this still work if the schema has $anchor but no $id so baseURI is actually for the containing OpenAPI document?
    const baseURI = id ?? context.baseURI // $anchor or $id forms the new base uri if present
    const jsonPointerFromBaseURI = id ? '' : context.jsonPointerFromBaseURI // json pointer is either restarting from new root if id, or continues from previous base uri
    const resolvedURIs = context.resolvedURIs
    if (id) {
      resolvedURIs.push(id)
      if (!hasFragment(id)) {
        resolvedURIs.push(resolveURIReference('#', id))
      }
    }

    if (!id && jsonPointerFromBaseURI === '') {
      // If no id fall back to the base URI if this is the root schema of the document
      resolvedURIs.push(baseURI)
      if (!hasFragment(baseURI)) {
        resolvedURIs.push(resolveURIReference('#', baseURI))
      }
    }

    return {
      configuration: resolvedConfiguration,
      baseURI: baseURI,
      jsonPointerFromBaseURI: jsonPointerFromBaseURI,
      objectType: context.objectType,
      jsonPointerFromObject: context.jsonPointerFromObject,
      resolvedURIs
    }
  },
  mergeReferencedObject: (context: Context, target: object, referencedObject: object) => {
    // Reapply siblings so that referencedObject does not override sibling properties
    const { ...siblings } = target
    Object.assign(target, referencedObject, siblings)
  }
})

const jsonSchemaDraft2020_12VisitorConfiguration = (options: Options): VisitorConfiguration => ({
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
  objectType: (context: Context): ObjectType | null => {
    const jsonPointer = context.jsonPointerFromObject
    if (
      context.objectType === 'schema' &&
      (jsonPointer === '' ||
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
        Boolean(jsonPointer.match(/^\/dependencies\/[^/]*$/)))
    ) {
      return 'schema'
    }
    return null
  },
  resolveContext: (context: Context, object: object): Context => {
    // Assume that object is a Schema object
    let resolvedConfiguration = context.configuration
    if (context.objectType === 'schema') {
      let $schema: string | undefined
      if ('$schema' in object && typeof object.$schema === 'string') {
        $schema = object.$schema
      } else {
        $schema = options?.jsonSchemaDialect ?? 'https://spec.openapis.org/oas/3.1/dialect/base'
      }
      switch ($schema) {
        case 'https://spec.openapis.org/oas/3.1/dialect/base':
          resolvedConfiguration = configuration(options)
          break
        case 'http://json-schema.org/draft-04/schema#':
          resolvedConfiguration = jsonSchemaDraft04VisitorConfiguration(options)
          break
        case 'https://json-schema.org/draft/2020-12/schema':
          resolvedConfiguration = jsonSchemaDraft2020_12VisitorConfiguration(options)
          break
        default:
          // Warn that $schema not recognized
          resolvedConfiguration = context.configuration
          break
      }
    }

    let $id: string | undefined
    if (context.objectType === 'schema' && '$id' in object && typeof object.$id === 'string') {
      $id = resolveURIReference(object.$id, context.baseURI)
    }

    // Resolve $anchor against $id, in practice these two shouldn't appear in the same schema
    let $anchor: string | undefined
    if (context.objectType === 'schema' && '$anchor' in object && typeof object.$anchor === 'string') {
      // In draft 2020-12, anchor becomes a URI fragemnt, but itself is not one, so insert # here.
      $anchor = resolveURIReference(`#${object.$anchor}`, $id ?? context.baseURI)
    }

    // XXX: Does this still work if the schema has $anchor but no $id so baseURI is actually for the containing OpenAPI document?
    const baseURI = $anchor ?? $id ?? context.baseURI // $anchor or $id forms the new base uri if present
    const jsonPointerFromBaseURI = $id || $anchor ? '' : context.jsonPointerFromBaseURI // json pointer is either restarting from new root if id, or continues from previous base uri
    const resolvedURIs = context.resolvedURIs
    if ($id) {
      resolvedURIs.push($id)
      if (!hasFragment($id)) {
        resolvedURIs.push(resolveURIReference('#', $id))
      }
    }
    if ($anchor) {
      resolvedURIs.push($anchor)
    }
    if (!$id && !$anchor && jsonPointerFromBaseURI === '') {
      // If no id fall back to the base URI if this is the root schema of the document
      resolvedURIs.push(baseURI)
      if (!hasFragment(baseURI)) {
        resolvedURIs.push(resolveURIReference('#', baseURI))
      }
    }

    return {
      configuration: resolvedConfiguration,
      baseURI: baseURI,
      jsonPointerFromBaseURI: jsonPointerFromBaseURI,
      objectType: context.objectType,
      jsonPointerFromObject: context.jsonPointerFromObject,
      resolvedURIs
    }
  },
  mergeReferencedObject: (context: Context, target: object, referencedObject: object) => {
    // This implementation will either merge referencedSchema's keywords alongside target,
    // unless there is a conflict between keywords (with some exceptions).
    // If there is a conflict, then referencedSchema will remain under the $ref keyword,
    // but dereferenced.
    // This assumes that all keywords are independent and don't interact with each other.
    const targetKeywords = Object.keys(target)
    const referencedKeywords = Object.keys(referencedObject).filter((keyword) => {
      // $id doesn't count as a conflict if we're going to merge the referenced schema
      if (keyword === '$id') {
        return false
      }
      // $defs doesn't count as a conflict if we're going to merge the referenced schema
      if (keyword === '$defs' || keyword === 'definitions') {
        return false
      }
      // keyword doesn't count as a conflict if they are the same value
      if (referencedObject[keyword] === target[keyword]) {
        return false
      }
      return true
    })
    const hasConflictingKeywords = targetKeywords.some((keyword) => referencedKeywords.includes(keyword))
    if (hasConflictingKeywords) {
      target['$ref'] = referencedObject
    } else {
      // Since no keywords appear in both, merge schemas into one as in draft 04.
      const { ...siblings } = target
      Object.assign(target, referencedObject, siblings)
    }
  }
})

const configuration = (options: Options): VisitorConfiguration => ({
  jsonSchemaDialect: 'http://json-schema.org/draft-04/schema#',
  objectType: (context: Context): ObjectType | null => {
    const jsonPointer = context.jsonPointerFromObject

    if (context.objectType === 'openAPI' && jsonPointer === '') {
      return 'openAPI'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/paths\/[^\/]*$/))) ||
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/webhooks\/[^\/]*$/))) ||
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/pathItems\/[^\/]*$/))) ||
      (context.objectType === 'callback' && Boolean(jsonPointer.match(/^\/[^/]*$/))) ||
      (context.objectType === 'pathItem' && jsonPointer === '')
    ) {
      return 'pathItem'
    }

    if (
      (context.objectType === 'pathItem' &&
        Boolean(jsonPointer.match(/^\/(get|put|post|delete|options|head|patch|trace)$/))) ||
      (context.objectType === 'operation' && jsonPointer === '')
    ) {
      return 'operation'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/parameters\/[^/]*$/))) ||
      (context.objectType === 'pathItem' && Boolean(jsonPointer.match(/^\/parameters\/[\d]+$/))) ||
      (context.objectType === 'operation' && Boolean(jsonPointer.match(/^\/parameters\/[\d]+$/))) ||
      (context.objectType === 'parameter' && jsonPointer === '')
    ) {
      return 'parameter'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/requestBodies\/[^/]*$/))) ||
      (context.objectType === 'operation' && jsonPointer === '/requestBody') ||
      (context.objectType === 'requestBody' && jsonPointer === '')
    ) {
      return 'requestBody'
    }

    if (
      (context.objectType === 'response' && Boolean(jsonPointer.match(/^\/content\/[^/]*$/))) ||
      (context.objectType === 'parameter' && Boolean(jsonPointer.match(/^\/content\/[^/]*$/))) ||
      (context.objectType === 'header' && Boolean(jsonPointer.match(/^\/content\/[^/]*$/))) ||
      (context.objectType === 'mediaType' && jsonPointer === '')
    ) {
      return 'mediaType'
    }

    if (
      (context.objectType === 'mediaType' && Boolean(jsonPointer.match(/^\/encoding\/[^/]*$/))) ||
      (context.objectType === 'encoding' && jsonPointer === '')
    ) {
      return 'encoding'
    }

    if (
      (context.objectType === 'operation' && jsonPointer === '/responses') ||
      (context.objectType === 'responses' && jsonPointer === '')
    ) {
      return 'responses'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/responses\/[^/]*$/))) ||
      (context.objectType === 'responses' && jsonPointer === '/default') ||
      (context.objectType === 'responses' && Boolean(jsonPointer.match(/^\/[1-5](?:\d{2}|XX)$/))) ||
      (context.objectType === 'response' && jsonPointer === '')
    ) {
      return 'response'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/callbacks\/[^/]*$/))) ||
      (context.objectType === 'operation' && Boolean(jsonPointer.match(/^\/callbacks\/[^/]*$/))) ||
      (context.objectType === 'callback' && jsonPointer == '')
    ) {
      return 'callback'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/examples\/[^/]*$/))) ||
      (context.objectType === 'parameter' && Boolean(jsonPointer.match(/^\/examples\/[^/]*$/))) ||
      (context.objectType === 'header' && Boolean(jsonPointer.match(/^\/examples\/[^/]*$/))) ||
      (context.objectType === 'mediaType' && Boolean(jsonPointer.match(/^\/examples\/[^/]*$/))) ||
      (context.objectType === 'example' && jsonPointer === '')
    ) {
      return 'example'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/links\/[^/]*$/))) ||
      (context.objectType === 'response' && Boolean(jsonPointer.match(/^\/links\/[^/]*$/))) ||
      (context.objectType === 'link' && jsonPointer === '')
    ) {
      return 'link'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/headers\/[^/]*$/))) ||
      (context.objectType === 'response' && Boolean(jsonPointer.match(/^\/headers\/[^/]*$/))) ||
      (context.objectType === 'encoding' && Boolean(jsonPointer.match(/^\/headers\/[^/]*$/))) ||
      (context.objectType === 'header' && jsonPointer === '')
    ) {
      return 'header'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/schemas\/[^/]*$/))) ||
      (context.objectType === 'parameter' && jsonPointer === '/schema') ||
      (context.objectType === 'header' && jsonPointer === '/schema') ||
      (context.objectType === 'mediaType' && jsonPointer === '/schema') ||
      (context.objectType === 'schema' && jsonPointer === '') ||
      // JSON Schema (Draft 2020-12)
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/\$defs\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && jsonPointer === '/not') ||
      (context.objectType === 'schema' && jsonPointer === '/if') ||
      (context.objectType === 'schema' && jsonPointer === '/then') ||
      (context.objectType === 'schema' && jsonPointer === '/else') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/dependentSchemas\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/prefixItems\/[\d]+$/))) ||
      (context.objectType === 'schema' && jsonPointer === '/items') ||
      (context.objectType === 'schema' && jsonPointer === '/contains') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/properties\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/patternProperties\/[^/]*$/))) ||
      (context.objectType === 'schema' && jsonPointer === '/additionalProperties') ||
      (context.objectType === 'schema' && jsonPointer === '/propertyNames') ||
      (context.objectType === 'schema' && jsonPointer === '/unevaluatedItems') ||
      (context.objectType === 'schema' && jsonPointer === '/unevaluatedProperties') ||
      (context.objectType === 'schema' && jsonPointer === '/contentSchema') ||
      // deprecated but still supported, TODO: verify
      (context.objectType === 'schema' && jsonPointer === '/additionalItems') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/definitions\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/dependencies\/[^/]*$/)))
    ) {
      return 'schema'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/securitySchemes\/[^/]*$/))) ||
      (context.objectType === 'securityScheme' && jsonPointer == '')
    ) {
      return 'securityScheme'
    }

    return null
  },
  resolveContext: (context: Context, object: object) => {
    if (context.objectType === 'schema') {
      return jsonSchemaDraft2020_12VisitorConfiguration(options).resolveContext(context, object)
    }

    const resolvedURIs = context.resolvedURIs
    if (context.jsonPointerFromBaseURI === '') {
      // Use the base URI if this is the root schema of the document
      resolvedURIs.push(context.baseURI)
      if (!hasFragment(context.baseURI)) {
        resolvedURIs.push(resolveURIReference('#', context.baseURI))
      }
    }

    return {
      configuration: context.configuration,
      baseURI: context.baseURI,
      jsonPointerFromBaseURI: context.jsonPointerFromBaseURI,
      objectType: context.objectType,
      jsonPointerFromObject: context.jsonPointerFromObject,
      resolvedURIs
    }
  },
  mergeReferencedObject: (context: Context, target: object, referencedObject: object) => {
    // summary and description are the only supported additional properties in OpenAPI 3.1
    const { summary, description, ...rest } = target as any
    Object.assign(target, referencedObject)

    if (options.mergeAdditionalProperties) {
      options.mergeAdditionalProperties(target, rest)
    }

    // Reapply summary and description so that referencedSchema does not override sibling properties
    Object.assign(target, { summary, description })
  }
})

export default configuration
