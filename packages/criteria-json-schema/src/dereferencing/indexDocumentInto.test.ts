/* eslint-env jest */
import { Index, indexDocumentInto } from './indexDocumentInto'
import visitorConfiguration from '../specification/draft-04/visitorConfiguration'
import { defaultBaseURI, defaultRetrieve } from './dereferenceJSONSchema'

const schema = {
  id: 'http://example.com/root.json',
  definitions: {
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

describe('indexDocumentInto()', () => {
  describe('draft-04', () => {
    const index = new Index()
    indexDocumentInto(index, schema, '', visitorConfiguration, defaultRetrieve)

    test('evaluates json pointers', () => {
      expect(index.findValue('http://example.com/root.json').value).toEqual(schema)
      expect(index.findValue('http://example.com/root.json#').value).toEqual(schema)
      expect(index.findValue('http://example.com/root.json#/definitions/A').value).toEqual(schema.definitions.A)
      expect(index.findValue('http://example.com/root.json#/definitions/B').value).toEqual(schema.definitions.B)
      expect(index.findValue('http://example.com/root.json#/definitions/B/definitions/X').value).toEqual(
        (schema.definitions.B as any).definitions.X
      )
      expect(index.findValue('http://example.com/root.json#/definitions/B/definitions/Y').value).toEqual(
        (schema.definitions.B as any).definitions.Y
      )
      expect(index.findValue('http://example.com/root.json#/definitions/C').value).toEqual(schema.definitions.C)
    })

    test('evaluates local identifiers', () => {
      expect(index.findValue('http://example.com/root.json#foo').value).toEqual({ id: '#foo' })
      expect(index.findValue('http://example.com/other.json#bar').value).toEqual({ id: '#bar' })

      // I think this is correct behavior, #bar is scoped to item.json
      expect(() => index.findValue('http://example.com/root.json#bar')).toThrow()
    })

    test('returns undefined for non-existent JSON pointer', () => {
      expect(() => index.findValue('http://example.com/root.json#/definitions/invalid')).toThrow()
    })

    test('returns undefined for non-existent local identifier', () => {
      expect(() => index.findValue('http://example.com/root.json#invalid')).toThrow()
    })

    test('does not evaluate to schema with uri id', () => {
      // none of these URIs are valid fragment identifiers
      expect(() => index.findValue('http://example.com/root.json#http://example.com/root.json')).toThrow()
      expect(() => index.findValue('http://example.com/root.json#http://example.com/other.json')).toThrow()
      expect(() => index.findValue('http://example.com/root.json#http://example.com/t/inner.json')).toThrow()
      expect(() =>
        index.findValue('http://example.com/root.json#urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f')
      ).toThrow()
      expect(() => index.findValue('http://example.com/root.json#other.json')).toThrow()
      expect(() => index.findValue('http://example.com/root.json#t/inner.json')).toThrow()
    })

    test('decodes URI encoding', () => {
      expect(index.findValue('http://example.com/root.json#/definitions/%20').value).toEqual({ id: '#space' })
      expect(index.findValue('http://example.com/root.json#/definitions/%2520').value).toEqual({ id: '#percent-20' })
      expect(index.findValue('http://example.com/root.json#/definitions/%23').value).toEqual({ id: '#hash' })
      expect(index.findValue('http://example.com/root.json#/definitions/%2523').value).toEqual({ id: '#percent-23' })
    })

    test('decodes JSON pointer encoding', () => {
      expect(index.findValue('http://example.com/root.json#/definitions/~0').value).toEqual({ id: '#tilde' })
      expect(index.findValue('http://example.com/root.json#/definitions/~1').value).toEqual({ id: '#slash' })
      expect(index.findValue('http://example.com/root.json#/definitions/~00').value).toEqual({ id: '#tilde-0' })
      expect(index.findValue('http://example.com/root.json#/definitions/~01').value).toEqual({ id: '#tilde-1' })
    })
  })
})
