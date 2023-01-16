/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-04'
import schema from './schema.json'
import dereferenced from './dereferenced'

describe('Schema without any $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any)
    expect(output).toEqual(dereferenced)
  })
})
