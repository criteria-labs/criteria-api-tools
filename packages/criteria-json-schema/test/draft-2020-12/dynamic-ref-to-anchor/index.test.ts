/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with $dynamicRef that points to static anchor in same schema', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json')
    }) as any
    expect(output).toCircularEqual(dereferenced)

    // // Dymamic extension
    // expect(output.unevaluatedProperties).toBe(false)
    // expect(output.properties.children.items.unevaluatedProperties).toBe(false)
  })
})
