import { $dynamicRefValidator } from './$dynamicRefValidator'
import { $refValidator } from './$refValidator'

export const coreValidators = {
  $ref: $refValidator,
  $dynamicRef: $dynamicRefValidator
}
