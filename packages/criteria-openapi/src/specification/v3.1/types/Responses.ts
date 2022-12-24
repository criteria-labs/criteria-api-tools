import { Reference } from './Reference'
import { Response } from './Response'

// The complete of status codes is maintained by IANA.
// See https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml

// See https://httpwg.org/specs/rfc7231.html#status.codes
type HTTPStatusCodeClass = '1' | '2' | '3' | '4' | '5'
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type HTTPStatusCode = `${HTTPStatusCodeClass}${Digit}${Digit}`

export type Responses<ReferenceType extends Reference | never> = {
  default?: Response<ReferenceType> | ReferenceType
} & {
  [Key in HTTPStatusCode]: Response<ReferenceType> | ReferenceType
} & {
  '1XX'?: Response<ReferenceType> | ReferenceType
  '2XX'?: Response<ReferenceType> | ReferenceType
  '3XX'?: Response<ReferenceType> | ReferenceType
  '4XX'?: Response<ReferenceType> | ReferenceType
  '5XX'?: Response<ReferenceType> | ReferenceType

  [key: `x-${string}`]: any
}
