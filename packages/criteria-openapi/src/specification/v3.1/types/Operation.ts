import { Callback } from './Callback'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Parameter } from './Parameter'
import { Reference } from './Reference'
import { RequestBody } from './RequestBody'
import { Responses } from './Responses'
import { SecurityRequirement } from './SecurityRequirement'
import { Server } from './Server'

export interface Operation<ReferenceType extends Reference | never> {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentation
  operationId?: string
  parameters?: Array<Parameter<ReferenceType> | ReferenceType>
  requestBody?: RequestBody<ReferenceType> | ReferenceType
  responses?: Responses<ReferenceType>
  callbacks?: { [key: string]: Callback<ReferenceType> | ReferenceType }
  deprecated?: boolean
  security?: SecurityRequirement[]
  servers?: Server[]

  [key: `x-${string}`]: any
}
