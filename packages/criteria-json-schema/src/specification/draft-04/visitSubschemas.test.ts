/* eslint-env jest */
import { JSONSchema } from './JSONSchema'
import { visitSubschemas } from './visitSubschemas'

describe('visitSubschemas()', () => {
  describe('draft-04', () => {
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

    test('detects subschemas', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
      })
      expect(visited).toEqual([
        [''],
        ['', '/items/0'],
        ['', '/items/0', '/properties/foo'],
        ['', '/items/0', '/properties/bar'],
        ['', '/items/1']
      ])
    })
    test('continues by default', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
      })
      expect(visited).toEqual([
        [''],
        ['', '/items/0'],
        ['', '/items/0', '/properties/foo'],
        ['', '/items/0', '/properties/bar'],
        ['', '/items/1']
      ])
    })
    test('stopping does not visit children or next siblings', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
        return subschema.id === '#first'
      })
      expect(visited).toEqual([[''], ['', '/items/0']])
    })
    test('stopping while visiting children does not visit remaining children', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
        return path.length > 0 && path[path.length - 1] === '/properties/foo'
      })
      expect(visited).toEqual([[''], ['', '/items/0'], ['', '/items/0', '/properties/foo']])
    })
    test('stops on truthy value', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
        return 1 as any
      })
      expect(visited).toEqual([['']])
    })
    test('continues on falsy', () => {
      const visited = []
      visitSubschemas(schema, '', {}, (subschema, path, state) => {
        visited.push(path)
        return null
      })
      expect(visited).toEqual([
        [''],
        ['', '/items/0'],
        ['', '/items/0', '/properties/foo'],
        ['', '/items/0', '/properties/bar'],
        ['', '/items/1']
      ])
    })
  })
})
