/* eslint-env jest */
import { JSONSchema } from './JSONSchema'
import { visitSubschemas } from './visitSubschemas'

describe('visitSubschemas()', () => {
  describe('draft-2020-12', () => {
    const schema: JSONSchema = {
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

    test('detects subschemas', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
        }
      )
      expect(visited).toEqual([
        [''],
        ['', '/prefixItems/0'],
        ['', '/prefixItems/0', '/properties/foo'],
        ['', '/prefixItems/0', '/properties/bar'],
        ['', '/prefixItems/1'],
        ['', '/prefixItems/2']
      ])
    })
    test('continues by default', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
        }
      )
      expect(visited).toEqual([
        [''],
        ['', '/prefixItems/0'],
        ['', '/prefixItems/0', '/properties/foo'],
        ['', '/prefixItems/0', '/properties/bar'],
        ['', '/prefixItems/1'],
        ['', '/prefixItems/2']
      ])
    })
    test('stopping does not visit children or next siblings', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
          return typeof subschema === 'object' && subschema.$anchor === 'first'
        }
      )
      expect(visited).toEqual([[''], ['', '/prefixItems/0']])
    })
    test('stopping while visiting children does not visit remaining children', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
          return path.length > 0 && path[path.length - 1] === '/properties/foo'
        }
      )
      expect(visited).toEqual([[''], ['', '/prefixItems/0'], ['', '/prefixItems/0', '/properties/foo']])
    })
    test('stops on truthy value', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
          return 1 as any
        }
      )
      expect(visited).toEqual([['']])
    })
    test('continues on falsy', () => {
      const visited = []
      visitSubschemas(
        schema,
        (location) => location === '',
        (subschema, path) => {
          visited.push(path)
          return null
        }
      )
      expect(visited).toEqual([
        [''],
        ['', '/prefixItems/0'],
        ['', '/prefixItems/0', '/properties/foo'],
        ['', '/prefixItems/0', '/properties/bar'],
        ['', '/prefixItems/1'],
        ['', '/prefixItems/2']
      ])
    })
  })
})
