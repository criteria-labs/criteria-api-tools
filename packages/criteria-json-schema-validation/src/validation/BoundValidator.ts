import type { JSONPointer } from '@criteria/json-pointer'
import { Output } from './Output'

export type BoundValidator = (instance: unknown, instanceLocation: JSONPointer) => Output
export type BoundValidatorWithAnnotationResults = (
  instance: unknown,
  instanceLocation: JSONPointer,
  annotationResults: Record<string, any>
) => Output
