import { metaSchemaIDDraft04, metaSchemaIDDraft06, metaSchemaIDDraft07 } from '@criteria/json-schema'
import { normalizedMetaSchemaID } from './normalizedMetaSchemaID'

describe('normalizedMetaSchemaID()', () => {
  test('adds trailing slash to Draft 04 if missing', () => {
    const result = normalizedMetaSchemaID('http://json-schema.org/draft-04/schema')
    expect(result).toEqual(metaSchemaIDDraft04)
  })
  test('adds trailing slash to Draft 06 if missing', () => {
    const result = normalizedMetaSchemaID('http://json-schema.org/draft-06/schema')
    expect(result).toEqual(metaSchemaIDDraft06)
  })
  test('adds trailing slash to Draft 07 if missing', () => {
    const result = normalizedMetaSchemaID('http://json-schema.org/draft-07/schema')
    expect(result).toEqual(metaSchemaIDDraft07)
  })
})
