import { Encoding } from './Encoding'
import { Example } from './Example'
import { Reference } from './Reference'
import { Schema } from './Schema'

export interface MediaType<ReferenceType extends Reference | never> {
  schema?: Schema<ReferenceType> | ReferenceType
  example?: any
  examples?: { [key: string]: Example | ReferenceType }
  encoding?: { [key: string]: Encoding<ReferenceType> }

  [key: `x-${string}`]: any
}
