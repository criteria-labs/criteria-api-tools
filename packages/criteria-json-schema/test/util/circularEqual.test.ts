/* eslint-env jest */
import circularEqual from './circularEqual'

describe('circularEqual()', () => {
  test('handles circular values', () => {
    const lhs: any = {
      self: null,
      child: {
        parent: null
      },
      children: []
    }
    lhs.self = lhs
    lhs.child.parent = lhs
    lhs.children.push(lhs)

    const rhs: any = {
      self: null,
      child: {
        parent: null
      },
      children: []
    }
    rhs.self = rhs
    rhs.child.parent = rhs
    rhs.children.push(rhs)
    expect(circularEqual(lhs, rhs)).toBe(true)
  })
})
