import { InstanceContext } from './draft-2020-12/InstanceContext'
import { Output } from './output'

export type Validator = (instance: unknown, instanceContext: InstanceContext) => Output
