import { validationValidators as validationValidatorsDraft04 } from '../../../draft-04/vocabularies/validation'
import { containsValidator } from './containsValidator'
import { exclusiveMaximumValidator } from './exclusiveMaximumValidator'
import { exclusiveMinimumValidator } from './exclusiveMinimumValidator'
import { formatValidator } from './formatValidator'
import { propertyNamesValidator } from './propertyNamesValidator'

export const validationValidators = {
  ...validationValidatorsDraft04,
  contains: containsValidator,
  exclusiveMinimum: exclusiveMinimumValidator,
  exclusiveMaximum: exclusiveMaximumValidator,
  propertyNames: propertyNamesValidator,
  format: formatValidator
}
