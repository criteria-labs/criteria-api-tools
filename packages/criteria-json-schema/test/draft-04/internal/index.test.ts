/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/specification/draft-04'
import schema from './schema.json'
import dereferenced from './dereferenced'

describe('Schema with internal $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.properties.name).toBe(output.definitions.name)
    expect(output.properties.name.properties.first).toBe(output.definitions.requiredString)
    expect(output.properties.name.properties.last).toBe(output.definitions.requiredString)
    expect(output.definitions.name.properties.last).toBe(output.definitions.requiredString)
    expect(output.definitions.name.properties.last).toBe(output.definitions.requiredString)
  })
})
