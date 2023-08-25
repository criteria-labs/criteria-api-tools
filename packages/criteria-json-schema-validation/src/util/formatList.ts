export function formatList(values: string[], conjunction: 'and' | 'or') {
  if (values.length === 0) {
    return ''
  }
  if (values.length === 1) {
    return values[0]
  }
  let commaSeparatedValues = values.slice(0, -1).join(', ')
  const finalValue = values[values.length - 1]
  return `${commaSeparatedValues} ${conjunction} ${finalValue}`
}
