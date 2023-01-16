/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with deeply-nested circular $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: retrieveFromFilesystem
    }) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.definitions.name).toBe(output.properties.name)
    expect(output.definitions.name).toBe(output.properties.level1.properties.name)
    expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.name)
    expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.level3.properties.name)
    expect(output.definitions.name).toBe(
      output.properties.level1.properties.level2.properties.level3.properties.level4.properties.name
    )
  })
})
