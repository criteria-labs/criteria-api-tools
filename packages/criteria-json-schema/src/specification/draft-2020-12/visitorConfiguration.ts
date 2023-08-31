import { hasFragment, resolveURIReference } from '../../util/uri'
import { Context } from '../../visitors/Context'
import { ReferenceMergePolicy, VisitorConfiguration } from '../../visitors/visitValues'
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
  isSimpleReference: (value: object, context: Context, policy: ReferenceMergePolicy) => {
    const jsonPointer = context.jsonPointerFromSchema
    const isLiteral =
      Boolean(jsonPointer.match(/^\/const(\/.*)?$/)) ||
      Boolean(jsonPointer.match(/^\/enum\/[\d]+(\/.*)?$/)) ||
      jsonPointer === '/properties' ||
      jsonPointer === '/patternProperties'
    return ('$ref' in value || '$dynamicRef' in value) && Object.keys(value).length === 1 && !isLiteral
  },
  resolveContext: (context: Context, schema: object, policy: ReferenceMergePolicy) => {
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
      if (
        context.jsonPointerFromBaseURI === '' &&
        context.jsonPointerFromSchema === '' &&
        context.baseURIIsResolvedSchemaID
      ) {
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
      baseURIIsResolvedSchemaID: $id || $anchor ? true : false,
      jsonPointerFromBaseURI,
      jsonPointerFromSchema: '',
      resolvedURIs
    }
  },
  mergeReferencedSchema: (target: object, referencedSchema: object, siblings: object, policy: ReferenceMergePolicy) => {
    const mergeReferencedSchemaByKeyword = () => {
      Object.assign(target, siblings)

      // This implementation will either merge referencedSchema's keywords alongside target,
      // unless there is a conflict between keywords (with some exceptions).
      // If there is a conflict, then referencedSchema will remain under the $ref keyword,
      // but dereferenced.
      // This assumes that all keywords are independent and don't interact with each other.
      const targetKeywords = Object.keys(target)
      const referencedKeywords = Object.keys(referencedSchema).filter((keyword) => {
        // $id doesn't count as a conflict if we're going to merge the referenced schema
        if (keyword === '$id') {
          return false
        }
        // $defs doesn't count as a conflict if we're going to merge the referenced schema
        if (keyword === '$defs' || keyword === 'definitions') {
          return false
        }
        // keyword doesn't count as a conflict if they are the same value
        if (referencedSchema[keyword] === target[keyword]) {
          return false
        }
        return true
      })
      const hasConflictingKeywords = targetKeywords.some((keyword) => referencedKeywords.includes(keyword))
      if (hasConflictingKeywords) {
        target['$ref'] = referencedSchema
      } else {
        // Since no keywords appear in both, merge schemas into one as in draft 04.
        const { ...siblings } = target
        Object.assign(target, referencedSchema, siblings)
      }
    }
    switch (policy) {
      case 'by_keyword':
        mergeReferencedSchemaByKeyword()
        break
      case 'overwrite':
        // ignore siblings
        Object.assign(target, referencedSchema)
        break
      case 'none':
        Object.assign(target, siblings)
        target['$ref'] = referencedSchema
        break
      case 'default':
      default:
        mergeReferencedSchemaByKeyword()
        break
    }
  }
}

export default configuration
