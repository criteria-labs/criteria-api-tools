import { constValidator } from './constValidator'
import { dependentRequiredValidator } from './dependentRequiredValidator'
import { enumValidator } from './enumValidator'
import { exclusiveMaximumValidator } from './exclusiveMaximumValidator'
import { exclusiveMinimumValidator } from './exclusiveMinimumValidator'
import { maxContainsValidator } from './maxContainsValidator'
import { maxItemsValidator } from './maxItemsValidator'
import { maxLengthValidator } from './maxLengthValidator'
import { maxPropertiesValidator } from './maxPropertiesValidator'
import { maximumValidator } from './maximumValidator'
import { minContainsValidator } from './minContainsValidator'
import { minItemsValidator } from './minItemsValidator'
import { minLengthValidator } from './minLengthValidator'
import { minPropertiesValidator } from './minPropertiesValidator'
import { minimumValidator } from './minimumValidator'
import { multipleOfValidator } from './multipleOfValidator'
import { patternValidator } from './patternValidator'
import { requiredValidator } from './requiredValidator'
import { typeValidator } from './typeValidator'
import { uniqueItemsValidator } from './uniqueItemsValidator'

export const validationValidators = {
  type: typeValidator,
  enum: enumValidator,
  const: constValidator,
  pattern: patternValidator,
  minLength: minLengthValidator,
  maxLength: maxLengthValidator,
  exclusiveMaximum: exclusiveMaximumValidator,
  multipleOf: multipleOfValidator,
  exclusiveMinimum: exclusiveMinimumValidator,
  maximum: maximumValidator,
  minimum: minimumValidator,
  dependentRequired: dependentRequiredValidator,
  maxProperties: maxPropertiesValidator,
  minProperties: minPropertiesValidator,
  required: requiredValidator,
  maxItems: maxItemsValidator,
  minItems: minItemsValidator,
  maxContains: maxContainsValidator,
  minContains: minContainsValidator,
  uniqueItems: uniqueItemsValidator
}
