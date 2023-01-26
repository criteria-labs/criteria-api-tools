/* eslint-env jest */
import { Index, indexDocumentInto } from './indexDocumentInto'
import visitorConfiguration from '../specification/v3.0/visitorConfiguration'
import { defaultBaseURI, defaultRetrieve } from './dereferenceOpenAPI'

// NOTE: id and definitions are actually unsupported in OpenAPI v3.0 Schema objects. We're just testing indexing here.
const openAPI = {
  openAPI: '3.0.3',
  info: {
    name: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      A: { id: '#foo' },
      B: {
        id: 'other.json',
        definitions: {
          X: { id: '#bar' },
          Y: { id: 't/inner.json' }
        }
      },
      C: {
        id: 'urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f'
      },

      ' ': { id: '#space' },
      '%20': { id: '#percent-20' },
      '#': { id: '#hash' },
      '%23': { id: '#percent-23' },
      '~': { id: '#tilde' },
      '/': { id: '#slash' },
      '~0': { id: '#tilde-0' },
      '~1': { id: '#tilde-1' }
    }
  }
}

describe('indexDocumentInto()', () => {
  describe('v3.0', () => {
    const index = new Index()
    indexDocumentInto(index, openAPI, 'openapi.json', visitorConfiguration, defaultRetrieve)

    test('evaluates json pointers', () => {
      expect(index.findValue('openapi.json').value).toEqual(openAPI)
      expect(index.findValue('openapi.json#').value).toEqual(openAPI)
      expect(index.findValue('openapi.json#/components/schemas/A').value).toEqual(openAPI.components.schemas.A)
      expect(index.findValue('openapi.json#/components/schemas/B').value).toEqual(openAPI.components.schemas.B)
      expect(index.findValue('openapi.json#/components/schemas/B/definitions/X').value).toEqual(
        (openAPI.components.schemas.B as any).definitions.X
      )
      expect(index.findValue('openapi.json#/components/schemas/B/definitions/Y').value).toEqual(
        (openAPI.components.schemas.B as any).definitions.Y
      )
      expect(index.findValue('openapi.json#/components/schemas/C').value).toEqual(openAPI.components.schemas.C)
    })

    test('does not evaluate local identifiers', () => {
      // This behavior in OpenAPI 3.0 is different to JSON Schema Draft 04
      expect(() => index.findValue('openapi.json#foo')).toThrow()
      expect(() => index.findValue('openapi.json#bar')).toThrow()
    })

    test('returns undefined for non-existent JSON pointer', () => {
      expect(() => index.findValue('openapi.json#/definitions/invalid')).toThrow()
    })

    test('returns undefined for non-existent local identifier', () => {
      expect(() => index.findValue('openapi.json#invalid')).toThrow()
    })

    test('does not evaluate to schema with uri id', () => {
      // none of these URIs are valid fragment identifiers
      expect(() => index.findValue('openapi.json#openapi.json')).toThrow()
      expect(() => index.findValue('openapi.json#http://example.com/other.json')).toThrow()
      expect(() => index.findValue('openapi.json#http://example.com/t/inner.json')).toThrow()
      expect(() => index.findValue('openapi.json#urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f')).toThrow()
      expect(() => index.findValue('openapi.json#other.json')).toThrow()
      expect(() => index.findValue('openapi.json#t/inner.json')).toThrow()
    })

    test('decodes URI encoding', () => {
      expect(index.findValue('openapi.json#/components/schemas/%20').value).toEqual({ id: '#space' })
      expect(index.findValue('openapi.json#/components/schemas/%2520').value).toEqual({ id: '#percent-20' })
      expect(index.findValue('openapi.json#/components/schemas/%23').value).toEqual({ id: '#hash' })
      expect(index.findValue('openapi.json#/components/schemas/%2523').value).toEqual({ id: '#percent-23' })
    })

    test('decodes JSON pointer encoding', () => {
      expect(index.findValue('openapi.json#/components/schemas/~0').value).toEqual({ id: '#tilde' })
      expect(index.findValue('openapi.json#/components/schemas/~1').value).toEqual({ id: '#slash' })
      expect(index.findValue('openapi.json#/components/schemas/~00').value).toEqual({ id: '#tilde-0' })
      expect(index.findValue('openapi.json#/components/schemas/~01').value).toEqual({ id: '#tilde-1' })
    })
  })
})
