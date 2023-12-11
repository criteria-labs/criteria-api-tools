import { additionalItemsValidator } from './additionalItemsValidator'
import { additionalPropertiesValidator } from './additionalPropertiesValidator'
import { allOfValidator } from './allOfValidator'
import { anyOfValidator } from './anyOfValidator'
import { constValidator } from './constValidator'
import { dependenciesValidator } from './dependenciesValidator'
import { enumValidator } from './enumValidator'
import { formatValidator } from './formatValidator'
import { itemsValidator } from './itemsValidator'
import { maxItemsValidator } from './maxItemsValidator'
import { maxLengthValidator } from './maxLengthValidator'
import { maxPropertiesValidator } from './maxPropertiesValidator'
import { maximumValidator } from './maximumValidator'
import { minItemsValidator } from './minItemsValidator'
import { minLengthValidator } from './minLengthValidator'
import { minPropertiesValidator } from './minPropertiesValidator'
import { minimumValidator } from './minimumValidator'
import { multipleOfValidator } from './multipleOfValidator'
import { notValidator } from './notValidator'
import { oneOfValidator } from './oneOfValidator'
import { patternPropertiesValidator } from './patternPropertiesValidator'
import { patternValidator } from './patternValidator'
import { propertiesValidator } from './propertiesValidator'
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
  multipleOf: multipleOfValidator,
  maximum: maximumValidator, // includes exclusiveMinimum
  minimum: minimumValidator, // includes exclusiveMaximum
  dependencies: dependenciesValidator,
  maxProperties: maxPropertiesValidator,
  minProperties: minPropertiesValidator,
  required: requiredValidator,
  items: itemsValidator,
  additionalItems: additionalItemsValidator,
  maxItems: maxItemsValidator,
  minItems: minItemsValidator,
  uniqueItems: uniqueItemsValidator,
  properties: propertiesValidator,
  patternProperties: patternPropertiesValidator,
  additionalProperties: additionalPropertiesValidator,
  allOf: allOfValidator,
  anyOf: anyOfValidator,
  oneOf: oneOfValidator,
  not: notValidator,
  format: formatValidator
}
