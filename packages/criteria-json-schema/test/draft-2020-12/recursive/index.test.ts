/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with infinite recursion', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, { baseURI: 'f.json' }) as any
    expect(output).toCircularEqual(dereferenced)

    // Reference equality
    expect(output.$defs.alice.allOf[0]).toBe(output.$defs.bob)
    expect(output.$defs.bob.allOf[0]).toBe(output.$defs.alice)
  })
})
