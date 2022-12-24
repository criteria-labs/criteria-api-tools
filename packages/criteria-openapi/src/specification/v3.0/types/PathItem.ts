import { Operation } from './Operation'
import { Parameter } from './Parameter'
import { Reference } from './Reference'
import { Server } from './Server'

export interface PathItem<ReferenceType extends Reference | never> {
  $ref?: ReferenceType extends Reference ? string : never
  summary?: string
  description?: string
  get?: Operation<ReferenceType>
  put?: Operation<ReferenceType>
  post?: Operation<ReferenceType>
  delete?: Operation<ReferenceType>
  options?: Operation<ReferenceType>
  head?: Operation<ReferenceType>
  patch?: Operation<ReferenceType>
  trace?: Operation<ReferenceType>
  servers?: Server[]
  parameters?: Array<Parameter<ReferenceType> | ReferenceType>

  [key: `x-${string}`]: any
}
