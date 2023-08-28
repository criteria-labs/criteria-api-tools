import { DereferencedJSONSchemaDraft2020_12, DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../util/JSONPointer'
import { InvalidOutput, Output, combineAnnotationResults } from '../output'
import { Validator } from '../types'
import { InstanceContext } from './InstanceContext'
import { additionalPropertiesValidator } from './applicator/additionalPropertiesValidator'
import { allOfValidator } from './applicator/allOfValidator'
import { anyOfValidator } from './applicator/anyOfValidator'
import { containsValidator } from './applicator/containsValidator'
import { dependentSchemasValidator } from './applicator/dependentSchemasValidator'
import { ifValidator } from './applicator/ifValidator'
import { itemsValidator } from './applicator/itemsValidator'
import { notValidator } from './applicator/notValidator'
import { oneOfValidator } from './applicator/oneOfValidator'
import { patternPropertiesValidator } from './applicator/patternPropertiesValidator'
import { prefixItemsValidator } from './applicator/prefixItemsValidator'
import { propertiesValidator } from './applicator/propertiesValidator'
import { propertyNamesValidator } from './applicator/propertyNamesValidator'
import { Cache } from './cache/Cache'
import { unevaluatedPropertiesValidator } from './unevaluated/unevaluatedPropertiesValidator'
import { constValidator } from './validation/constValidator'
import { dependentRequiredValidator } from './validation/dependentRequiredValidator'
import { enumValidator } from './validation/enumValidator'
import { exclusiveMaximumValidator } from './validation/exclusiveMaximumValidator'
import { exclusiveMinimumValidator } from './validation/exclusiveMinimumValidator'
import { maxContainsValidator } from './validation/maxContainsValidator'
import { maxItemsValidator } from './validation/maxItemsValidator'
import { maxLengthValidator } from './validation/maxLengthValidator'
import { maxPropertiesValidator } from './validation/maxPropertiesValidator'
import { maximumValidator } from './validation/maximumValidator'
import { minContainsValidator } from './validation/minContainsValidator'
import { minItemsValidator } from './validation/minItemsValidator'
import { minLengthValidator } from './validation/minLengthValidator'
import { minPropertiesValidator } from './validation/minPropertiesValidator'
import { minimumValidator } from './validation/minimumValidator'
import { multipleOfValidator } from './validation/multipleOfValidator'
import { patternValidator } from './validation/patternValidator'
import { requiredValidator } from './validation/requiredValidator'
import { typeValidator } from './validation/typeValidator'
import { uniqueItemsValidator } from './validation/uniqueItemsValidator'
import { $refValidator } from './core/$refValidator'
import { unevaluatedItemsValidator } from './unevaluated/unevaluatedItemsValidator'

type ValidatorsByKeyword = {
  [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]: (
    schema: DereferencedJSONSchemaObjectDraft2020_12,
    schemaLocation: JSONPointer,
    context: ValidationContext
  ) => Validator
}

const coreValidatorsByKeyword: ValidatorsByKeyword = {
  // Core vocabulary
  $ref: $refValidator
}

const validationValidatorsByKeyword: ValidatorsByKeyword = {
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

// Applicator vocabulary
const applicatorValidatorsByKeyword: ValidatorsByKeyword = {
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

// Unevaluated vocabulary
const unevaluatedValidatorsByKeyword: ValidatorsByKeyword = {
  unevaluatedProperties: unevaluatedPropertiesValidator,
  unevaluatedItems: unevaluatedItemsValidator
}

export interface ValidationOptions {
  failFast: boolean
  defaultMetaSchemaURI: string
  retrieveMetaSchema: (uri: string) => any
}

export class ValidationContext {
  private readonly options: ValidationOptions
  private readonly state: { schema: DereferencedJSONSchemaDraft2020_12; schemaLocation: JSONPointer }[] = []
  private readonly cache: Cache
  constructor(options: ValidationOptions) {
    this.options = options
    this.cache = new Cache(options.retrieveMetaSchema)
  }

  get failFast() {
    return this.options.failFast
  }

  validatorForSchema(schema: DereferencedJSONSchemaDraft2020_12, schemaLocation: JSONPointer): Validator {
    if (typeof schema === 'boolean') {
      if (schema) {
        return (instance: unknown, instanceContext: InstanceContext): Output => {
          return { valid: true }
        }
      } else {
        return (instance: unknown, instanceContext: InstanceContext): Output => {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: null,
            instanceLocation: instanceContext.instanceLocation,
            error: `Expected no value but found ${instance}`
          }
        }
      }
    }

    let boundValidator = this.cache.validatorForSchema(schema)
    if (boundValidator) {
      return boundValidator
    }

    // indirection so that keyword validators can access this validator from the cache recursively
    let indirectValidator: Validator = null
    boundValidator = (instance: unknown, instanceContext: InstanceContext) => {
      return indirectValidator(instance, instanceContext)
    }
    this.cache.setValidatorForSchema(schema, boundValidator)

    // push state
    this.state.push({ schema, schemaLocation })

    // TODO: handle unsupported meta schema
    const metaSchema = this.cache.metaSchemaForSchemas(
      this.state.map((s) => s.schema) as DereferencedJSONSchemaObjectDraft2020_12[],
      { defaultMetaSchemaURI: this.options.defaultMetaSchemaURI }
    )

    let validatorsByKeyword: ValidatorsByKeyword = {}
    const vocabularyKeys = Object.keys(metaSchema.$vocabulary ?? {})
    if (vocabularyKeys.includes('https://json-schema.org/draft/2020-12/vocab/core')) {
      validatorsByKeyword = {
        ...validatorsByKeyword,
        ...coreValidatorsByKeyword
      }
    }
    if (vocabularyKeys.includes('https://json-schema.org/draft/2020-12/vocab/validation')) {
      validatorsByKeyword = {
        ...validatorsByKeyword,
        ...validationValidatorsByKeyword
      }
    }
    if (vocabularyKeys.includes('https://json-schema.org/draft/2020-12/vocab/applicator')) {
      validatorsByKeyword = {
        ...validatorsByKeyword,
        ...applicatorValidatorsByKeyword
      }
    }
    // add unevaluated keywords last
    if (vocabularyKeys.includes('https://json-schema.org/draft/2020-12/vocab/unevaluated')) {
      validatorsByKeyword = {
        ...validatorsByKeyword,
        ...unevaluatedValidatorsByKeyword
      }
    }
    for (const [vocabularyKey, vocabularyRequired] of Object.entries(metaSchema.$vocabulary ?? {})) {
      if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/core') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/applicator') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/validation') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/meta-data') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/format-annotation') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/format-assertion') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/content') {
      } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/unevaluated') {
      } else {
        if (vocabularyRequired) {
          throw new Error(`Unsupported vocabulary: ${vocabularyKey}`)
        }
      }
    }

    // let validatorsByKeyword: ValidatorsByKeyword<> = {}
    // for (const [vocabularyKey, vocabularyRequired] of Object.entries(metaSchema.$vocabulary ?? {})) {
    //   if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/core') {
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/applicator') {
    //     validatorsByKeyword = { ...validatorsByKeyword, ...applicatorValidatorsByKeyword }
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/validation') {
    //     // if (metaSchema.$id === 'http://localhost:1234/draft2020-12/metaschema-no-validation.json') {
    //     //   throw new Error('Got here 3')
    //     // }
    //     validatorsByKeyword = { ...validatorsByKeyword, ...validationValidatorsByKeyword }
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/meta-data') {
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/format-annotation') {
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/format-assertion') {
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/content') {
    //   } else if (vocabularyKey === 'https://json-schema.org/draft/2020-12/vocab/unevaluated') {
    //     // add unevaluated keywords last
    //     validatorsByKeyword = { ...validatorsByKeyword, ...unevaluatedValidatorsByKeyword }
    //   } else {
    //     if (vocabularyRequired) {
    //       throw new Error(`Unsupported vocabulary: ${vocabularyKey}`)
    //     }
    //   }
    // }

    const validators = Object.entries(validatorsByKeyword)
      .map(([keyword, keywordValidator]) => {
        if (!(keyword in schema)) {
          return null
        }

        if (keyword === 'then' || keyword === 'else') {
          // handled by the 'if' validator
          return null
        }

        let boundKeywordValidator = this.cache.validatorForSchemaKeyword(schema, keyword as any) as Validator
        if (boundKeywordValidator) {
          return boundKeywordValidator
        }

        boundKeywordValidator = keywordValidator(schema, schemaLocation, this)
        this.cache.setValidatorForSchemaKeyword(schema, keyword as any, boundKeywordValidator)
        return boundKeywordValidator
      })
      .filter((validator) => typeof validator === 'function')

    // TODO: allow passing handler for custom keywords

    const failFast = this.failFast
    indirectValidator = (instance: unknown, instanceContext: InstanceContext) => {
      let outputs: Output[] = []
      for (const validator of validators) {
        const output = validator(instance, instanceContext)
        outputs.push(output)
        if ('annotationResults' in output) {
          instanceContext.addAnnotationResults(output.annotationResults)
        }
        if (!output.valid && failFast) {
          break
        }
      }

      const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
      const valid = invalidOutputs.length === 0
      if (valid) {
        return {
          valid: true,
          schemaLocation,
          instanceLocation: instanceContext.instanceLocation,
          annotationResults: combineAnnotationResults(
            outputs.map((output) => ('annotationResults' in output ? output.annotationResults : {}))
          )
        }
      } else {
        return {
          valid: false,
          schemaLocation,
          instanceLocation: instanceContext.instanceLocation,
          errors: invalidOutputs
        }
      }
    }

    // pop state
    this.state.pop()

    return boundValidator
  }
}
