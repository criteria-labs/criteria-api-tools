/* eslint-env jest */
import cyclicEqual from './cyclicEqual'

describe('cyclicEqual()', () => {
  test('handles cyclic values', () => {
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
    expect(cyclicEqual(lhs, rhs)).toBe(true)
  })
})
