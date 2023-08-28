import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context } from '../../visitors/Context'
import { VisitorConfiguration } from '../../visitors/visitValues'
import visitorConfigurationDraft04 from '../draft-04/visitorConfiguration'

const configuration: VisitorConfiguration = {
  dialect: 'https://json-schema.org/draft/2020-12/schema',
  isSubschema: (context: Context): boolean => {
    const jsonPointer = context.jsonPointerFromSchema
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
  },
  resolveContext: (context: Context, schema: object) => {
    let resolvedConfiguration = context.configuration
    if ('$schema' in schema && typeof schema.$schema === 'string') {
      switch (schema.$schema) {
        case 'http://json-schema.org/draft-04/schema#':
          resolvedConfiguration = visitorConfigurationDraft04
          break
        case 'https://json-schema.org/draft/2020-12/schema':
          resolvedConfiguration = configuration
          break
        default:
          // Warn that $schema not recognized
          resolvedConfiguration = context.configuration
          break
      }
    }

    let $id: string | undefined
    if ('$id' in schema && typeof schema.$id === 'string') {
      if (context.jsonPointerFromBaseURI === '' && context.baseURIIsSchemaID) {
        $id = context.baseURI
      } else {
        $id = resolveURIReference(schema.$id, context.baseURI)
      }
    }

    // Resolve $anchor against $id, in practice these two shouldn't appear in the same schema
    let $anchor: string | undefined
    if ('$anchor' in schema && typeof schema.$anchor === 'string') {
      // In draft 2020-12, anchor becomes a URI fragemnt, but itself is not one, so insert # here.
      $anchor = resolveURIReference(`#${schema.$anchor}`, $id ?? context.baseURI)
    }

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
      baseURI,
      baseURIIsSchemaID: baseURI === $id,
      jsonPointerFromBaseURI,
      jsonPointerFromSchema: '',
      resolvedURIs
    }
  },
  mergeReferencedSchema: (target: object, referencedSchema: object) => {
    // According to the specification test suite, ref creates new scope when adjacent to keywords
    target['$ref'] = referencedSchema
  }
}
export default configuration
