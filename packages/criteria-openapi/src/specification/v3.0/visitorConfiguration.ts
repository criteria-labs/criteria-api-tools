import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context, ObjectType } from '../../visitors/Context'
import { VisitorConfiguration } from '../../visitors/visitValues'

export default {
  jsonSchemaDialect: 'http://json-schema.org/draft-04/schema#',
  objectType: (context: Context): ObjectType | null => {
    const jsonPointer = context.jsonPointerFromObject

    if (context.objectType === 'openAPI' && jsonPointer === '') {
      return 'openAPI'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/paths\/[^\/]*$/))) ||
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
      (context.objectType === 'mediaType' && jsonPointer === '')
    ) {
      return 'mediaType'
    }

    if (context.objectType === 'encoding' && jsonPointer === '') {
      return 'encoding'
    }

    if (context.objectType === 'responses' && jsonPointer === '') {
      return 'responses'
    }

    if (
      (context.objectType === 'openAPI' && Boolean(jsonPointer.match(/^\/components\/responses\/[^/]*$/))) ||
      (context.objectType === 'responses' && jsonPointer === '/default') ||
      (context.objectType === 'responses' && Boolean(jsonPointer.match(/^\/[1-5](?:\\d{2}|XX)$/))) ||
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
      // JSON Schema (extended subset of Draft 04)
      (context.objectType === 'schema' && jsonPointer === '/additionalItems') ||
      (context.objectType === 'schema' && jsonPointer === '/items') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/items\/[\d]+$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/properties\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/patternProperties\/[^/]*$/))) ||
      (context.objectType === 'schema' && jsonPointer === '/additionalProperties') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/dependencies\/[^/]*$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/))) ||
      (context.objectType === 'schema' && jsonPointer === '/not') ||
      (context.objectType === 'schema' && Boolean(jsonPointer.match(/^\/definitions\/[^/]*$/)))
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
  }
} satisfies VisitorConfiguration
