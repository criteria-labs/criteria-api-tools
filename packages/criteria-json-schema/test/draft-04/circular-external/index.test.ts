/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with circular (recursive) external $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: retrieveFromFilesystem
    }) as any
    expect(output).toCircularEqual(dereferenced)

    // Reference equality
    expect(output.definitions.person.properties.spouse).toBe(output.definitions.person)
    expect(output.definitions.parent.properties.children.items).toBe(output.definitions.child)
    expect(output.definitions.child.properties.parents.items).toBe(output.definitions.parent)
  })
})
