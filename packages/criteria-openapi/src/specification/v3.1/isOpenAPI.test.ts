/* eslint-env jest */
import { isOpenAPI } from './isOpenAPI'

describe('isOpenAPI()', () => {
  test('returns true when value is an OpenAPI v3.1 document', () => {
    expect(isOpenAPI({ openapi: '3.1.0' })).toBe(true)
  })
  test('returns false when value is not an OpenAPI document', () => {
    expect(isOpenAPI({ foo: true })).toBe(false)
  })
  test('returns false when value is an OpenAPI document but the wrong version', () => {
    expect(isOpenAPI({ openapi: '3.0.3' })).toBe(false)
  })
})
