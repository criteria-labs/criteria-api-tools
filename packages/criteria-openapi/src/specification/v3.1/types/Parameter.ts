import { Example } from './Example'
import { MediaType } from './MediaType'
import { Reference } from './Reference'
import { Schema } from './Schema'

export interface Parameter<ReferenceType extends Reference | never> {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean

  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: Schema<ReferenceType> | ReferenceType
  example?: any
  examples?: { [key: string]: Example | ReferenceType }

  content?: { [key: string]: MediaType<ReferenceType> }

  [key: `x-${string}`]: any
}
