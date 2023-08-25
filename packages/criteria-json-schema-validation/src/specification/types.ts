import { JSONPointer } from '../util/JSONPointer'
import { Output } from './output'

export type Validator = (instance: unknown, instanceLocation: JSONPointer) => Output
