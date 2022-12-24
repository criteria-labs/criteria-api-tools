import { PathItem } from './PathItem'
import { Reference } from './Reference'

export interface Paths<ReferenceType extends Reference | never> {
  [key: `/${string}`]: PathItem<ReferenceType>

  [key: `x-${string}`]: any
}
