/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-04'
import schema from './schema.json'
import dereferenced from './dereferenced'

describe('Schema with infinite recursion', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, { baseURI: 'f.json' }) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.definitions.alice.allOf[0]).toBe(output.definitions.bob)
    expect(output.definitions.bob.allOf[0]).toBe(output.definitions.alice)
  })
})
