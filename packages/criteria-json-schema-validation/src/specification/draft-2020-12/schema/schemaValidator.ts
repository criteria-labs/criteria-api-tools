import { DereferencedJSONSchemaDraft2020_12, DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { additionalPropertiesValidator } from '../applicator/additionalPropertiesValidator'
import { allOfValidator } from '../applicator/allOfValidator'
import { anyOfValidator } from '../applicator/anyOfValidator'
import { containsValidator } from '../applicator/containsValidator'
import { dependentSchemasValidator } from '../applicator/dependentSchemasValidator'
import { ifValidator } from '../applicator/ifValidator'
import { itemsValidator } from '../applicator/itemsValidator'
import { notValidator } from '../applicator/notValidator'
import { oneOfValidator } from '../applicator/oneOfValidator'
import { patternPropertiesValidator } from '../applicator/patternPropertiesValidator'
import { prefixItemsValidator } from '../applicator/prefixItemsValidator'
import { propertiesValidator } from '../applicator/propertiesValidator'
import { propertyNamesValidator } from '../applicator/propertyNames'
import { Cache } from '../cache/Cache'
import { allValidator } from '../compound/allValidator'
import { Validator } from '../../types'
import { constValidator } from '../validation/constValidator'
import { dependentRequiredValidator } from '../validation/dependentRequiredValidator'
import { enumValidator } from '../validation/enumValidator'
import { exclusiveMaximumValidator } from '../validation/exclusiveMaximumValidator'
import { exclusiveMinimumValidator } from '../validation/exclusiveMinimumValidator'
import { maxContainsValidator } from '../validation/maxContainsValidator'
import { maxItemsValidator } from '../validation/maxItemsValidator'
import { maxLengthValidator } from '../validation/maxLengthValidator'
import { maxPropertiesValidator } from '../validation/maxPropertiesValidator'
import { maximumValidator } from '../validation/maximumValidator'
import { minContainsValidator } from '../validation/minContainsValidator'
import { minItemsValidator } from '../validation/minItemsValidator'
import { minLengthValidator } from '../validation/minLengthValidator'
import { minPropertiesValidator } from '../validation/minPropertiesValidator'
import { minimumValidator } from '../validation/minimumValidator'
import { multipleOfValidator } from '../validation/multipleOfValidator'
import { patternValidator } from '../validation/patternValidator'
import { requiredValidator } from '../validation/requiredValidator'
import { typeValidator } from '../validation/typeValidator'
import { uniqueItemsValidator } from '../validation/uniqueItemsValidator'
import { escapeReferenceToken } from '@criteria/json-pointer'

const validatorsByKeyword: {
  [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]: (
    schema: DereferencedJSONSchemaObjectDraft2020_12,
    schemaLocation: JSONPointer,
    { cache, failFast }: { cache: Cache; failFast: boolean }
  ) => Validator
} = {
  // Applicator vocabulary
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
  contains: containsValidator,

  // Validation vocabulary
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

export function schemaKeywordValidator<Keyword extends keyof DereferencedJSONSchemaObjectDraft2020_12>(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  keyword: Keyword,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator | null {
  if (keyword === 'then' || keyword === 'else') {
    // handled by the 'if' validator
    return null
  }

  let boundValidator = cache.validatorForSchemaKeyword(schema, keyword)
  if (boundValidator) {
    return boundValidator
  }

  const validator = validatorsByKeyword[keyword]
  if (validator) {
    boundValidator = validator(schema, schemaLocation, { cache, failFast })
    cache.setValidatorForSchemaKeyword(schema, keyword, boundValidator)
    return boundValidator
  }

  // unknown keyword
  // TODO: allow passing handler to customize behavior
  return null
}

export function schemaValidator(
  schema: DereferencedJSONSchemaDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  if (typeof schema === 'boolean') {
    if (schema) {
      return (instance: unknown, instanceLocation: JSONPointer) => {
        return { valid: true }
      }
    } else {
      return (instance: unknown, instanceLocation: JSONPointer) => {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: null,
          instanceLocation,
          error: `Expected no value but found ${instance}`
        }
      }
    }
  }

  let boundValidator = cache.validatorForSchema(schema)
  if (boundValidator) {
    return boundValidator
  }

  // indirection so that keyword validators can access this validator from the cache recursively
  let indirectValidator: Validator = null
  boundValidator = (instance: unknown, instanceLocation: JSONPointer) => {
    return indirectValidator(instance, instanceLocation)
  }
  cache.setValidatorForSchema(schema, boundValidator)

  indirectValidator = allValidator(
    Object.keys(schema)
      .map((keyword: keyof DereferencedJSONSchemaObjectDraft2020_12) => {
        return schemaKeywordValidator(schema, schemaLocation, keyword, { cache, failFast })
      })
      .filter((validator) => typeof validator === 'function'),
    { failFast }
  )

  return boundValidator
}
