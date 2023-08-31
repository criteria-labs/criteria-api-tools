import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context } from '../../visitors/Context'
import { ReferenceMergePolicy, VisitorConfiguration } from '../../visitors/visitValues'
import visitorConfigurationDraft2020_12 from '../draft-2020-12/visitorConfiguration'

const configuration: VisitorConfiguration = {
  dialect: 'http://json-schema.org/draft-04/schema#',
  isSubschema: (context: Context): boolean => {
    const jsonPointer = context.jsonPointerFromSchema
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
  },
  isSimpleReference: (value: object, context: Context, policy: ReferenceMergePolicy) => {
    const jsonPointer = context.jsonPointerFromSchema
    const isLiteral =
      Boolean(jsonPointer.match(/^\/const(\/.*)?$/)) ||
      Boolean(jsonPointer.match(/^\/enum\/[\d]+(\/.*)?$/)) ||
      jsonPointer === '/properties' ||
      jsonPointer === '/patternProperties'

    if (policy === 'overwrite' || policy === 'none') {
      return ('$ref' in value || '$dynamicRef' in value) && !isLiteral
    } else {
      return ('$ref' in value || '$dynamicRef' in value) && Object.keys(value).length === 1 && !isLiteral
    }
  },
  resolveContext: (context: Context, schema: object, policy: ReferenceMergePolicy) => {
    if (policy === 'overwrite' || policy === 'none') {
      // $ref or $dynamicRef prevents sibling keywords $schema and id from being read
      if ('$ref' in schema) {
        schema = { $ref: schema['$ref'] }
      } else if ('$dynamicRef' in schema) {
        schema = { $dynamicRef: schema['$dynamicRef'] }
      }
    }

    let resolvedConfiguration = context.configuration
    if ('$schema' in schema && typeof schema.$schema === 'string') {
      switch (schema.$schema) {
        case 'http://json-schema.org/draft-04/schema#':
          resolvedConfiguration = configuration
          break
        case 'https://json-schema.org/draft/2020-12/schema':
          resolvedConfiguration = visitorConfigurationDraft2020_12
          break
        default:
          // Warn that $schema not recognized
          resolvedConfiguration = context.configuration
          break
      }
    }

    let id: string | undefined
    if ('id' in schema && typeof schema.id === 'string') {
      if (
        context.jsonPointerFromBaseURI === '' &&
        context.jsonPointerFromSchema === '' &&
        context.baseURIIsResolvedSchemaID
      ) {
        id = context.baseURI
      } else {
        id = resolveURIReference(schema.id, context.baseURI)
      }
    }

    const baseURI = id ?? context.baseURI // id forms the new base uri if present
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
      baseURI,
      baseURIIsResolvedSchemaID: id ? true : false,
      jsonPointerFromBaseURI,
      jsonPointerFromSchema: '',
      resolvedURIs
    }
  },
  mergeReferencedSchema: (target: object, referencedSchema: object, siblings: object, policy: ReferenceMergePolicy) => {
    switch (policy) {
      case 'by_keyword': {
        // Reapply siblings so that referencedSchema does not override sibling properties
        Object.assign(target, referencedSchema, siblings)
        break
      }
      case 'overwrite':
        // Ignore siblings
        Object.assign(target, referencedSchema)
        break
      case 'none':
        // none is not valid for Draft 04 schemas, same effect as overwite
        Object.assign(target, referencedSchema)
        break
      case 'default':
      default: {
        // default is to merge
        Object.assign(target, referencedSchema, siblings)
        break
      }
    }
  }
}

export default configuration
