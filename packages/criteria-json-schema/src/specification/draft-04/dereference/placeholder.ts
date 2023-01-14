import { URI } from '../uri'

export const placeholderSymbol = Symbol('placeholder')

export interface Placeholder {
  [placeholderSymbol]: PlaceholderInfo
}

interface PlaceholderInfo {
  uris?: URI[]
  indirect?: any
}

export const isPlaceholder = (value: any): value is Placeholder => {
  return typeof value === 'object' && typeof value[placeholderSymbol] === 'object'
}
