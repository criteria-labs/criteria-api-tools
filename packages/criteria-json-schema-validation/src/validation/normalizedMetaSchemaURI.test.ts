import { metaSchemaURIDraft04, metaSchemaURIDraft06, metaSchemaURIDraft07 } from '@criteria/json-schema'
import { normalizedMetaSchemaURI } from './normalizedMetaSchemaURI'

describe('normalizedMetaSchemaURI()', () => {
  test('adds trailing slash to Draft 04 if missing', () => {
    const result = normalizedMetaSchemaURI('http://json-schema.org/draft-04/schema')
    expect(result).toEqual(metaSchemaURIDraft04)
  })
  test('adds trailing slash to Draft 06 if missing', () => {
    const result = normalizedMetaSchemaURI('http://json-schema.org/draft-06/schema')
    expect(result).toEqual(metaSchemaURIDraft06)
  })
  test('adds trailing slash to Draft 07 if missing', () => {
    const result = normalizedMetaSchemaURI('http://json-schema.org/draft-07/schema')
    expect(result).toEqual(metaSchemaURIDraft07)
  })
})
