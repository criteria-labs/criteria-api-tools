import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../util/JSONPointer'

export type ValidOutput = {
  valid: true
}

export type InvalidOutput =
  | {
      valid: false
      schemaLocation: JSONPointer
      schemaKeyword: keyof DereferencedJSONSchemaObjectDraft2020_12 | null
      instanceLocation: JSONPointer
      error: string
    }
  | {
      valid: false
      errors: InvalidOutput[]
    }

export type Output = ValidOutput | InvalidOutput

export function summarizedOutput(outputs: Output[]): Output {
  const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
  if (invalidOutputs.length === 0) {
    return { valid: true }
  }
  if (invalidOutputs.length === 1) {
    return invalidOutputs[0]
  }
  return {
    valid: false,
    errors: invalidOutputs
  }
}
