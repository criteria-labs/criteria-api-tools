import { JSONPointer } from '../../util/JSONPointer'
import { hasFragment, resolveURIReference, splitFragment, URI } from '../../util/uri'
import { uriFragmentIsJSONPointer } from '../../util/uriFragmentIsJSONPointer'
import { Context } from '../../visitors/Context'
import { VisitorConfiguration } from '../../visitors/visitValues'

export default {
  isSubschema: (context: Context): boolean => {
    const jsonPointer = context.jsonPointerFromSchema
    return (
      jsonPointer === '' ||
      Boolean(jsonPointer.match(/^\/\$defs\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/allOf\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/anyOf\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/oneOf\/[\d]+$/)) ||
      jsonPointer === '/not' ||
      jsonPointer === '/if' ||
      jsonPointer === '/then' ||
      jsonPointer === '/else' ||
      Boolean(jsonPointer.match(/^\/dependentSchemas\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/prefixItems\/[\d]+$/)) ||
      jsonPointer === '/items' ||
      jsonPointer === '/contains' ||
      Boolean(jsonPointer.match(/^\/properties\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/patternProperties\/[^/]+$/)) ||
      jsonPointer === '/additionalProperties' ||
      jsonPointer === '/propertyNames' ||
      jsonPointer === '/unevaluatedItems' ||
      jsonPointer === '/unevaluatedProperties' ||
      jsonPointer === '/contentSchema' ||
      // deprecated but still supported, TODO: verify
      jsonPointer === '/additionalItems' ||
      Boolean(jsonPointer.match(/^\/items\/[\d]+$/)) ||
      Boolean(jsonPointer.match(/^\/dependencies\/[^/]+$/)) ||
      Boolean(jsonPointer.match(/^\/definitions\/[^/]+$/))
    )
  },
  resolveSchemaContext: (context: Context, schema: object) => {
    let $id: string | undefined
    if ('$id' in schema && typeof schema.$id === 'string') {
      $id = resolveURIReference(schema.$id, context.baseURI)
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
      baseURI,
      jsonPointerFromBaseURI,
      jsonPointerFromSchema: '',
      resolvedURIs
    }
  },
  resolveReferenceContext: (context: Context, reference: { $ref: string }) => {
    const resolvedURIs = context.resolvedURIs
    if (context.jsonPointerFromBaseURI === '') {
      // Use the base URI if this is the root schema of the document
      resolvedURIs.push(context.baseURI)
      if (!hasFragment(context.baseURI)) {
        resolvedURIs.push(resolveURIReference('#', context.baseURI))
      }
    }

    return {
      baseURI: context.baseURI,
      jsonPointerFromBaseURI: context.jsonPointerFromBaseURI,
      jsonPointerFromSchema: context.jsonPointerFromSchema,
      resolvedURIs: resolvedURIs
    }
  },
  appendJSONPointer: (context: Context, jsonPointer: JSONPointer) => {
    return {
      baseURI: context.baseURI,
      jsonPointerFromBaseURI: `${context.jsonPointerFromBaseURI}${jsonPointer}`,
      jsonPointerFromSchema: `${context.jsonPointerFromSchema}${jsonPointer}`,
      resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
        return `${uri}${jsonPointer}` // TODO: URI encode, but not slashes
      })
      // TODO: need noURIFragment and add #?
    }
  }
} satisfies VisitorConfiguration
