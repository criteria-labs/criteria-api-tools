import { Callback } from './Callback'
import { Example } from './Example'
import { Header } from './Header'
import { Link } from './Link'
import { Parameter } from './Parameter'
import { PathItem } from './PathItem'
import { Reference } from './Reference'
import { RequestBody } from './RequestBody'
import { Response } from './Response'
import { Schema } from './Schema'
import { SecurityScheme } from './SecurityScheme'

export interface Components<ReferenceType extends Reference | never> {
  schemas?: { [key: string]: Schema<ReferenceType> | ReferenceType }
  responses?: { [key: string]: Response<ReferenceType> | ReferenceType }
  parameters?: { [key: string]: Parameter<ReferenceType> | ReferenceType }
  examples?: { [key: string]: Example | ReferenceType }
  requestBodies?: { [key: string]: RequestBody<ReferenceType> | ReferenceType }
  headers?: { [key: string]: Header<ReferenceType> | ReferenceType }
  securitySchemes?: { [key: string]: SecurityScheme | ReferenceType }
  links?: { [key: string]: Link | ReferenceType }
  callbacks?: { [key: string]: Callback<ReferenceType> | ReferenceType }
  pathItems?: { [key: string]: PathItem<ReferenceType> | ReferenceType }

  [key: `x-${string}`]: any
}
