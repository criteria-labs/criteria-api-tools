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
  resolveSchemaContext: (context: Context, schema: object) => {
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
