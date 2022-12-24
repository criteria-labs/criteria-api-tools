import { Header } from './Header'
import { Link } from './Link'
import { MediaType } from './MediaType'
import { Reference } from './Reference'

export interface Response<ReferenceType extends Reference | never> {
  description: string
  headers?: { [key: string]: Header<ReferenceType> | ReferenceType }
  content?: { [key: string]: MediaType<ReferenceType> }
  links?: { [key: string]: Link | ReferenceType }

  [key: `x-${string}`]: any
}
