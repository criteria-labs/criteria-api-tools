import { JSONPointer } from '../util/JSONPointer'

export type ValidOutput = {
  valid: true
  schemaLocation: JSONPointer
  schemaKeyword?: string
  instanceLocation: JSONPointer
  annotationResults?: Record<string, any>
}

export type InvalidOutput = {
  valid: false
  schemaLocation: JSONPointer
  schemaKeyword?: string
  instanceLocation: JSONPointer
  message: string
  errors?: InvalidOutput[]
}

export type Output = ValidOutput | InvalidOutput
