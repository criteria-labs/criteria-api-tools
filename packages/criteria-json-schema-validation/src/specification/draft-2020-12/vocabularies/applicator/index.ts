import { additionalPropertiesValidator } from './additionalPropertiesValidator'
import { allOfValidator } from './allOfValidator'
import { anyOfValidator } from './anyOfValidator'
import { containsValidator } from './containsValidator'
import { dependentSchemasValidator } from './dependentSchemasValidator'
import { ifValidator } from './ifValidator'
import { itemsValidator } from './itemsValidator'
import { notValidator } from './notValidator'
import { oneOfValidator } from './oneOfValidator'
import { patternPropertiesValidator } from './patternPropertiesValidator'
import { prefixItemsValidator } from './prefixItemsValidator'
import { propertiesValidator } from './propertiesValidator'
import { propertyNamesValidator } from './propertyNamesValidator'

export const applicatorValidators = {
  allOf: allOfValidator,
  anyOf: anyOfValidator,
  oneOf: oneOfValidator,
  if: ifValidator,
  not: notValidator,
  properties: propertiesValidator,
  additionalProperties: additionalPropertiesValidator,
  patternProperties: patternPropertiesValidator,
  dependentSchemas: dependentSchemasValidator,
  propertyNames: propertyNamesValidator,
  items: itemsValidator,
  prefixItems: prefixItemsValidator,
  contains: containsValidator
}
