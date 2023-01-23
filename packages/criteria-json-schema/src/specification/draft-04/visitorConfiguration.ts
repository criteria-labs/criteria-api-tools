import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context } from '../../visitors/Context'
import { VisitorConfiguration } from '../../visitors/visitValues'
import visitorConfigurationDraft04 from '../draft-04/visitorConfiguration'
import visitorConfigurationDraft2020_12 from '../draft-2020-12/visitorConfiguration'

export default {
  dialect: 'http://json-schema.org/draft-04/schema#',
  isSubschema: (context: Context): boolean => {
    const jsonPointer = context.jsonPointerFromSchema
    return (
      jsonPointer === '' ||
      jsonPointer === '/additionalItems' ||
      jsonPointer === '/items' ||
      Boolean(jsonPointer.match(/^\/items\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/properties\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/patternProperties\/[^/]+$/)) ||
      jsonPointer === '/additionalProperties' ||
      Boolean(jsonPointer.match(/^\/dependencies\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/)) ||
      jsonPointer === '/not' ||
      Boolean(jsonPointer.match(/^\/definitions\/[^/]+$/))
    )
  },
  resolveContext: (context: Context, schema: object) => {
    let resolvedConfiguration = context.configuration
    if ('$schema' in schema && typeof schema.$schema === 'string') {
      switch (schema.$schema) {
        case 'http://json-schema.org/draft-04/schema#':
          resolvedConfiguration = visitorConfigurationDraft04
        case 'https://json-schema.org/draft/2020-12/schema':
          resolvedConfiguration = visitorConfigurationDraft2020_12
        default:
          // Warn that $schema not recognized
          resolvedConfiguration = context.configuration
      }
    }

    let id: string | undefined
    if ('id' in schema && typeof schema.id === 'string') {
      id = resolveURIReference(schema.id, context.baseURI)
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
      jsonPointerFromBaseURI,
      jsonPointerFromSchema: '',
      resolvedURIs
    }
  },
  mergeReferencedSchema: (target: object, referencedSchema: object) => {
    // Reapply siblings so that referencedSchema does not override sibling properties
    const { ...siblings } = target
    Object.assign(target, referencedSchema, siblings)
  }
} satisfies VisitorConfiguration
