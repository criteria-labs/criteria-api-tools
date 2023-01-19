import { JSONPointer } from '../../util/JSONPointer'
import { encodeURIFragment, hasFragment, resolveURIReference, splitFragment, URI } from '../../util/uri'
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
  resolveContext: (context: Context, schema: object) => {
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
  }
} satisfies VisitorConfiguration
