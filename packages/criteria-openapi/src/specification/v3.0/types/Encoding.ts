import { Header } from './Header'
import { Reference } from './Reference'

export interface Encoding<ReferenceType extends Reference | never> {
  contentType?: string
  headers?: { [key: string]: Header<ReferenceType> | ReferenceType }
  style?: string
  explode?: boolean
  allowReserved?: boolean

  [key: `x-${string}`]: any
}
