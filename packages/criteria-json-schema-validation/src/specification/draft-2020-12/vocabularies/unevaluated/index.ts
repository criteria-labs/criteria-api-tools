import { unevaluatedItemsValidator } from './unevaluatedItemsValidator'
import { unevaluatedPropertiesValidator } from './unevaluatedPropertiesValidator'

export const unevaluatedValidators = {
  unevaluatedProperties: unevaluatedPropertiesValidator,
  unevaluatedItems: unevaluatedItemsValidator
}
