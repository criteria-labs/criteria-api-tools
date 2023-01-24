/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import schema from './schema.json'
import dereferenced from './dereferenced'

describe('Schema with internal $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.properties.name).toBe(output.$defs.name)
    expect(output.properties.name.properties.first).toBe(output.$defs.requiredString)
    expect(output.properties.name.properties.last).toBe(output.$defs.requiredString)
    expect(output.$defs.name.properties.last).toBe(output.$defs.requiredString)
    expect(output.$defs.name.properties.last).toBe(output.$defs.requiredString)
  })
})
