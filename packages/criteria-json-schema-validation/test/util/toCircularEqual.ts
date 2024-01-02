import { matcherHint, printDiffOrStringify, printExpected, printReceived, stringify } from 'jest-matcher-utils'
import equal from 'fast-deep-equal'

// Omit colon and one or more spaces, so can call getLabelPrinter.
const EXPECTED_LABEL = 'Expected'
const RECEIVED_LABEL = 'Received'

// The optional property of matcher context is true if undefined.
const isExpand = (expand?: boolean): boolean => expand !== false

export function toCircularEqual(received: unknown, expected: unknown) {
  const matcherName = 'toCircularEqual'

  const pass = equal(received, expected)

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined) +
        '\n\n' +
        `Expected: not ${printExpected(expected)}\n` +
        (stringify(expected) !== stringify(received) ? `Received:     ${printReceived(received)}` : '')
    : () =>
        matcherHint(matcherName, undefined, undefined) +
        '\n\n' +
        printDiffOrStringify(expected, received, EXPECTED_LABEL, RECEIVED_LABEL, isExpand(this.expand))

  return { message, name: matcherName, pass }
}
