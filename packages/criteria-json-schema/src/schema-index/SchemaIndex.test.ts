/* eslint-env jest */
import { retrieveUsingLookup } from '../retrievers'
import { metaSchemaURI as metaSchemaURIDraft04 } from '../specification/draft-04/JSONSchema'
import { SchemaIndex } from './SchemaIndex'

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

describe('SchemaIndex', () => {
  describe('addDocument()', () => {
    describe('indexes all schemas', () => {
      describe('ref within remote ref', () => {
        const documents = {
          '': {
            $ref: 'http://localhost:1234/subSchemas.json#/refToInteger'
          },
          'http://localhost:1234/subSchemas.json': {
            integer: {
              type: 'integer'
            },
            refToInteger: {
              $ref: '#/integer'
            }
          }
        }
        const index = new SchemaIndex({
          cloned: false,
          retrieve: retrieveUsingLookup(documents),
          defaultMetaSchemaURI: metaSchemaURIDraft04
        })
        index.addRootSchema(documents[''], '')

        expect(index.baseURIForDocument(documents[''])).toBeDefined()
        expect(index.baseURIForDocument(documents['http://localhost:1234/subSchemas.json'])).toBeDefined()

        expect(index.baseURIForSchema(documents[''])).toBeDefined()
        expect(index.baseURIForSchema(documents['http://localhost:1234/subSchemas.json'].integer)).toBeDefined()
        expect(index.baseURIForSchema(documents['http://localhost:1234/subSchemas.json'].refToInteger)).toBeDefined()
      })
    })
    describe('draft-04', () => {
      const index = new SchemaIndex({
        cloned: true,
        defaultMetaSchemaURI: metaSchemaURIDraft04
      })
      index.addRootSchema(schema, '')

      test('evaluates json pointers', () => {
        expect(index.find('http://example.com/root.json')).toEqual(schema)
        expect(index.find('http://example.com/root.json#')).toEqual(schema)
        expect(index.find('http://example.com/root.json#/definitions/A')).toEqual(schema.definitions.A)
        expect(index.find('http://example.com/root.json#/definitions/B')).toEqual(schema.definitions.B)
        expect(index.find('http://example.com/root.json#/definitions/B/definitions/X')).toEqual(
          (schema.definitions.B as any).definitions.X
        )
        expect(index.find('http://example.com/root.json#/definitions/B/definitions/Y')).toEqual(
          (schema.definitions.B as any).definitions.Y
        )
        expect(index.find('http://example.com/root.json#/definitions/C')).toEqual(schema.definitions.C)
      })

      test('evaluates local identifiers', () => {
        expect(index.find('http://example.com/root.json#foo')).toEqual({ id: '#foo' })
        expect(index.find('http://example.com/other.json#bar')).toEqual({ id: '#bar' })

        // I think this is correct behavior, #bar is scoped to item.json
        expect(index.find('http://example.com/root.json#bar')).toBeUndefined()
      })

      test('returns undefined for non-existent JSON pointer', () => {
        expect(index.find('http://example.com/root.json#/definitions/invalid')).toBeUndefined()
      })

      test('returns undefined for non-existent local identifier', () => {
        expect(index.find('http://example.com/root.json#invalid')).toBeUndefined()
      })

      test('does not evaluate to schema with uri id', () => {
        // none of these URIs are valid fragment identifiers
        expect(index.find('http://example.com/root.json#http://example.com/root.json')).toBeUndefined()
        expect(index.find('http://example.com/root.json#http://example.com/other.json')).toBeUndefined()
        expect(index.find('http://example.com/root.json#http://example.com/t/inner.json')).toBeUndefined()
        expect(index.find('http://example.com/root.json#urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f')).toBeUndefined()
        expect(index.find('http://example.com/root.json#other.json')).toBeUndefined()
        expect(index.find('http://example.com/root.json#t/inner.json')).toBeUndefined()
      })

      test('decodes URI encoding', () => {
        expect(index.find('http://example.com/root.json#/definitions/%20')).toEqual({ id: '#space' })
        expect(index.find('http://example.com/root.json#/definitions/%2520')).toEqual({ id: '#percent-20' })
        expect(index.find('http://example.com/root.json#/definitions/%23')).toEqual({ id: '#hash' })
        expect(index.find('http://example.com/root.json#/definitions/%2523')).toEqual({ id: '#percent-23' })
      })

      test('decodes JSON pointer encoding', () => {
        expect(index.find('http://example.com/root.json#/definitions/~0')).toEqual({ id: '#tilde' })
        expect(index.find('http://example.com/root.json#/definitions/~1')).toEqual({ id: '#slash' })
        expect(index.find('http://example.com/root.json#/definitions/~00')).toEqual({ id: '#tilde-0' })
        expect(index.find('http://example.com/root.json#/definitions/~01')).toEqual({ id: '#tilde-1' })
      })
    })
  })
})
