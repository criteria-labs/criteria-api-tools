/* eslint-env jest */
import visitorConfiguration04 from '../specification/draft-04/visitorConfiguration'
import visitorConfiguration2020_12 from '../specification/draft-2020-12/visitorConfiguration'
import { JSONSchema as JSONSchemaDraft04 } from '../specification/draft-04/JSONSchema'
import { JSONSchema as JSONSchemaDraft2020_12 } from '../specification/draft-2020-12/JSONSchema'
import { visitValues } from './visitValues'

describe('visitValues()', () => {
  describe('draft-04', () => {
    const schema: JSONSchemaDraft04 = {
      items: [
        {
          id: '#first',
          properties: {
            foo: {},
            bar: {}
          }
        },
        { id: '#second' }
      ]
    }

    test('detects kinds', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push({ kind, baseURI: context.baseURI, jsonPointer: context.jsonPointerFromBaseURI })
      })
      expect(visited).toEqual([
        { kind: 'schema', baseURI: '', jsonPointer: '' },
        { kind: 'array', baseURI: '', jsonPointer: '/items' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '' },
        { kind: 'primitive', baseURI: '#first', jsonPointer: '/id' },
        { kind: 'object', baseURI: '#first', jsonPointer: '/properties' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '/properties/foo' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '/properties/bar' },
        { kind: 'schema', baseURI: '#second', jsonPointer: '' },
        { kind: 'primitive', baseURI: '#second', jsonPointer: '/id' }
      ])
    })
    test('continues by default', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
      })
      expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo', '/properties/bar', '', '/id'])
    })
    test('stopping does not visit children or next siblings', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return value.id === '#first'
      })
      expect(visited).toEqual(['', '/items', ''])
    })
    test('stopping while visiting children does not visit remaining children', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return context.jsonPointerFromBaseURI === '/properties/foo'
      })
      expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo'])
    })
    test('stops on truthy value', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return 1 as any
      })
      expect(visited).toEqual([''])
    })
    test('continues on falsy', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration04, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return null
      })
      expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo', '/properties/bar', '', '/id'])
    })
  })

  describe('draft-2020-12', () => {
    const schema: JSONSchemaDraft2020_12 = {
      prefixItems: [
        {
          $anchor: 'first',
          properties: {
            foo: {},
            bar: {}
          }
        } as any,
        { $anchor: 'second' },
        { $id: 'third' }
      ]
    }

    test('detects kinds', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push({ kind, baseURI: context.baseURI, jsonPointer: context.jsonPointerFromBaseURI })
      })
      expect(visited).toEqual([
        { kind: 'schema', baseURI: '', jsonPointer: '' },
        { kind: 'array', baseURI: '', jsonPointer: '/prefixItems' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '' },
        { kind: 'primitive', baseURI: '#first', jsonPointer: '/$anchor' },
        { kind: 'object', baseURI: '#first', jsonPointer: '/properties' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '/properties/foo' },
        { kind: 'schema', baseURI: '#first', jsonPointer: '/properties/bar' },
        { kind: 'schema', baseURI: '#second', jsonPointer: '' },
        { kind: 'primitive', baseURI: '#second', jsonPointer: '/$anchor' },
        { kind: 'schema', baseURI: 'third', jsonPointer: '' },
        { kind: 'primitive', baseURI: 'third', jsonPointer: '/$id' }
      ])
    })
    test('continues by default', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
      })
      expect(visited).toEqual([
        '',
        '/prefixItems',
        '',
        '/$anchor',
        '/properties',
        '/properties/foo',
        '/properties/bar',
        '',
        '/$anchor',
        '',
        '/$id'
      ])
    })
    test('stopping does not visit children or next siblings', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return value.$anchor === 'first'
      })
      expect(visited).toEqual(['', '/prefixItems', ''])
    })
    test('stopping while visiting children does not visit remaining children', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return context.jsonPointerFromBaseURI === '/properties/foo'
      })
      expect(visited).toEqual(['', '/prefixItems', '', '/$anchor', '/properties', '/properties/foo'])
    })
    test('stops on truthy value', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return 1 as any
      })
      expect(visited).toEqual([''])
    })
    test('continues on falsy', () => {
      const visited = []
      visitValues(schema, null, 'default', visitorConfiguration2020_12, (value, kind, context) => {
        visited.push(context.jsonPointerFromBaseURI)
        return null
      })
      expect(visited).toEqual([
        '',
        '/prefixItems',
        '',
        '/$anchor',
        '/properties',
        '/properties/foo',
        '/properties/bar',
        '',
        '/$anchor',
        '',
        '/$id'
      ])
    })
  })
})
