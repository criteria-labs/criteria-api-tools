import { Parameter } from './Parameter'
import { Reference } from './Reference'

export type Header<ReferenceType extends Reference | never> = Omit<Parameter<ReferenceType>, 'name' | 'in'>
