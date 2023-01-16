/* eslint-env jest */
import { JSONSchema } from '../../JSONSchema'
import { visitValues } from './visitValues'

const schema: JSONSchema = {
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

describe('visitValues()', () => {
  test('detects kinds', () => {
    const visited = []
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push({ kind, baseURI: context.baseURI, jsonPointer: context.jsonPointer })
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
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push(context.jsonPointer)
    })
    expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo', '/properties/bar', '', '/id'])
  })
  test('stopping does not visit children or next siblings', () => {
    const visited = []
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push(context.jsonPointer)
      return value.id === '#first'
    })
    expect(visited).toEqual(['', '/items', ''])
  })
  test('stopping while visiting children does not visit remaining children', () => {
    const visited = []
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push(context.jsonPointer)
      return context.jsonPointer === '/properties/foo'
    })
    expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo'])
  })
  test('stops on truthy value', () => {
    const visited = []
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push(context.jsonPointer)
      return 1 as any
    })
    expect(visited).toEqual([''])
  })
  test('continues on falsy', () => {
    const visited = []
    visitValues(schema, { baseURI: '', jsonPointer: '', resolvedURIs: [] }, (value, kind, context) => {
      visited.push(context.jsonPointer)
      return null
    })
    expect(visited).toEqual(['', '/items', '', '/id', '/properties', '/properties/foo', '/properties/bar', '', '/id'])
  })
})
