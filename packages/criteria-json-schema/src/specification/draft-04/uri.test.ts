/* eslint-env jest */
import { isAbsoluteURI, isSameDocumentReference, resolveURIReference } from './uri'

describe('isAbsoluteURI()', () => {
  test('returns true for uri', () => {
    expect(isAbsoluteURI('uri:///path')).toEqual(true)
  })
  test('returns true for uri with query', () => {
    expect(isAbsoluteURI('uri:///path?query')).toEqual(true)
  })
  test('returns false for uri with fragment', () => {
    expect(isAbsoluteURI('uri:///path#body')).toEqual(false)
  })
  test('returns false for uri with query and fragment', () => {
    expect(isAbsoluteURI('uri:///path?query#body')).toEqual(false)
  })
  test('returns false for relative uri', () => {
    expect(isAbsoluteURI('path')).toEqual(false)
  })
  test('returns false for relative uri with query', () => {
    expect(isAbsoluteURI('path?query')).toEqual(false)
  })
  test('returns false for relative uri with fragment', () => {
    expect(isAbsoluteURI('path#body')).toEqual(false)
  })
  test('returns false for relative uri with query and fragment', () => {
    expect(isAbsoluteURI('path?query#body')).toEqual(false)
  })
  test('returns false for fragment', () => {
    expect(isAbsoluteURI('#body')).toEqual(false)
  })
  test('returns false for empty fragment', () => {
    expect(isAbsoluteURI('#')).toEqual(false)
  })
  test('returns false for empty string', () => {
    expect(isAbsoluteURI('')).toEqual(false)
  })
})

describe('isSameDocumentReference()', () => {
  test('returns false for uri', () => {
    expect(isSameDocumentReference('uri:///path')).toEqual(false)
  })
  test('returns false for uri with fragment', () => {
    expect(isSameDocumentReference('uri:///path#body')).toEqual(false)
  })
  test('returns false for relative uri', () => {
    expect(isSameDocumentReference('path')).toEqual(false)
  })
  test('returns false for relative uri with fragment', () => {
    expect(isSameDocumentReference('path#body')).toEqual(false)
  })
  test('returns true for fragment', () => {
    expect(isSameDocumentReference('#body')).toEqual(true)
  })
  test('returns true for empty fragment', () => {
    expect(isSameDocumentReference('#')).toEqual(true)
  })
  test('returns false for empty string', () => {
    expect(isSameDocumentReference('')).toEqual(false)
  })
})

describe('resolveURIReference()', () => {
  test('resolving fragment against uri succeeds', () => {
    expect(resolveURIReference('#body', 'path')).toEqual('path#body')
  })
  test('resolving empty fragment against uri succeeds', () => {
    expect(resolveURIReference('#', 'path')).toEqual('path#')
  })
  test('resolves fragment against uri with fragment replaces fragment', () => {
    expect(resolveURIReference('#newbody', 'path#oldbody')).toEqual('path#newbody')
  })
  test('resolving uri reference against empty uri returns original uri reference', () => {
    expect(resolveURIReference('path', '')).toEqual('path')
  })
  test('resolving fragment against empty uri returns original fragment', () => {
    expect(resolveURIReference('#body', '')).toEqual('#body')
  })
  test('resolving empty fragment against empty uri returns original fragment', () => {
    expect(resolveURIReference('#', '')).toEqual('#')
  })
})

// TODO: encoding
// does this double-encode? resolveURIReference(`#${encodeURIComponent(jsonPointer)}`, rootURI)
