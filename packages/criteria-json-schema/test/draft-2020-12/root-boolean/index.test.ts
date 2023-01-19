/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import schema from './schema.json'
import dereferenced from './dereferenced'

describe('Schema that is a boolean', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any) as any
    expect(output).toEqual(dereferenced)
  })
})
