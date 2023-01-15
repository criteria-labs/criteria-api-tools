/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('$refs that are substrings of each other', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: retrieveFromFilesystem
    }) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.properties.firstName).toBe(output.definitions.name)
    expect(output.properties.middleName).toBe(output.definitions['name-with-min-length'])
    expect(output.properties.lastName).toBe(output.definitions['name-with-min-length-max-length'])
  })
})
