import { MediaType } from './MediaType'
import { Reference } from './Reference'

export interface RequestBody<ReferenceType extends Reference | never> {
  description?: string
  content: { [key: string]: MediaType<ReferenceType> }
  required?: boolean

  [key: `x-${string}`]: any
}
