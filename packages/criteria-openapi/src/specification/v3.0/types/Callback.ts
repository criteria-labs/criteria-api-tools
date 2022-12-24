import { PathItem } from './PathItem'
import { Reference } from './Reference'

export interface Callback<ReferenceType extends Reference | never> {
  [key: string]: PathItem<ReferenceType>

  [key: `x-${string}`]: any
}
