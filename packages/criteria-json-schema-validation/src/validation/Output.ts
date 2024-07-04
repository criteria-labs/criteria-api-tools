import type { JSONPointer } from '@criteria/json-pointer'

export type ValidFlagOutput = {
  valid: true
  schemaLocation: JSONPointer
  schemaKeyword?: string
  instanceLocation: JSONPointer
  annotationResults?: Record<string, any>
}
export type InvalidFlagOutput = { valid: false }
export type FlagOutput = ValidFlagOutput | InvalidFlagOutput

export type ValidVerboseOutput = {
  valid: true
  schemaLocation: JSONPointer
  schemaKeyword?: string
  instanceLocation: JSONPointer
  annotationResults?: Record<string, any>
}

export type InvalidVerboseOutput = {
  valid: false
  schemaLocation: JSONPointer
  schemaKeyword?: string
  instanceLocation: JSONPointer
  message: string
  details?: any
  errors?: InvalidVerboseOutput[]
}

export type VerboseOutput = ValidVerboseOutput | InvalidVerboseOutput

export type OutputFormat = 'flag' | 'verbose'

// export type Output<Format extends OutputFormat> = Format extends 'flag' ? FlagOutput : VerboseOutput
export type Output = FlagOutput | VerboseOutput
export type ValidOutput = ValidFlagOutput | ValidVerboseOutput
export type InvalidOutput = InvalidFlagOutput | InvalidVerboseOutput
