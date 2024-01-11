import { validationValidators as validationValidatorsDraft06 } from '../../../draft-06/vocabularies/validation'
import { formatValidator } from './formatValidator'
import { ifValidator } from './ifValidator'

export const validationValidators = {
  ...validationValidatorsDraft06,
  if: ifValidator,
  format: formatValidator
}
