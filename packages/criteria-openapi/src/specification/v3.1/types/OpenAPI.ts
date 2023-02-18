import { Components } from './Components'
import { ExternalDocumentation } from './ExternalDocumentation'
import { Info } from './Info'
import { PathItem } from './PathItem'
import { Paths } from './Paths'
import { Reference } from './Reference'
import { SecurityRequirement } from './SecurityRequirement'
import { Server } from './Server'
import { Tag } from './Tag'

export interface OpenAPI<ReferenceType extends Reference | never = Reference> {
  openapi: string
  info: Info
  jsonSchemaDialect?: string
  servers?: Server[]
  paths?: Paths<ReferenceType>
  webhooks?: { [key: string]: PathItem<ReferenceType> | ReferenceType }
  components?: Components<ReferenceType>
  security?: SecurityRequirement[]
  tags?: Tag[]
  externalDocs?: ExternalDocumentation

  [key: `x-${string}`]: any
}

export type DereferencedOpenAPI = OpenAPI<never>
