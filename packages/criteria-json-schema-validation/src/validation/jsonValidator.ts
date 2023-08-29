import { DereferencedJSONSchemaObjectDraft2020_12, dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import validatorConfiguration2020_12 from '../specification/draft-2020-12/validatorConfiguration'
import { reduceAnnotationResults } from '../specification/draft-2020-12/vocabularies/reduceAnnotationResults'
import { JSONPointer } from '../util/JSONPointer'
import { BoundValidator, BoundValidatorWithAnnotationResults } from './BoundValidator'
import { InvalidOutput, Output } from './Output'

export type ValidatorContext = {
  failFast: boolean
  validatorForSchema: (schema: object | boolean, schemaLocation: JSONPointer) => BoundValidator
}

export type KeywordValidator = (
  schema: object,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) => BoundValidatorWithAnnotationResults

export interface ValidatorConfiguration {
  defaultMetaSchemaURI: string
  dereferenceJSONSchema: (schema: any, options?: { retrieve?: (uri: string) => any }) => any
  validatatorsByKeywordByVocabulary: Record<string, Record<string, KeywordValidator>>
}

export interface Options {
  failFast?: boolean
  retrieve?: (uri: string) => any
  configuration?: ValidatorConfiguration
}

export const defaultFailFast = false
export const defaultDereferenceJSONSchema = (schema: any) => dereferenceJSONSchemaDraft2020_12(schema)
export const defaultConfiguration = validatorConfiguration2020_12

export function jsonValidator(schema: object | boolean, options?: Options): (instance: unknown) => void {
  const failFast = options?.failFast ?? defaultFailFast
  const configuration = options?.configuration ?? defaultConfiguration

  // used to find the meta schema
  const parentSchemas: object[] = []

  const cachedValidatorsBySchema = new Map<object, BoundValidator>()
  const cachedValidatorsBySchemaByKeyword: {
    [keyword: string]: Map<object, BoundValidatorWithAnnotationResults>
  } = {}
  const cachedMetaSchemasBySchema = new Map<object, { $vocabulary: Record<string, boolean> }>()

  const validatorForSchema = (schema: object | boolean, schemaLocation: JSONPointer): BoundValidator => {
    if (typeof schema === 'boolean') {
      return validatorForBooleanSchema(schema, schemaLocation)
    } else {
      return validatorForObjectSchema(schema, schemaLocation)
    }
  }

  const validatorForBooleanSchema = (schema: boolean, schemaLocation: JSONPointer): BoundValidator => {
    if (schema) {
      return (instance: unknown, instanceLocation: JSONPointer): Output => {
        return { valid: true, schemaLocation, instanceLocation }
      }
    } else {
      return (instance: unknown, instanceLocation: JSONPointer): Output => {
        return {
          valid: false,
          schemaLocation,
          instanceLocation,
          message: `Expected no value but found ${instance}`
        }
      }
    }
  }

  const validatorForObjectSchema = (schema: object, schemaLocation: JSONPointer): BoundValidator => {
    let boundValidator = cachedValidatorsBySchema.get(schema)
    if (boundValidator) {
      return boundValidator
    }

    // indirection so that keyword validators can access this validator from the cache recursively
    let indirectValidator: BoundValidator = null
    boundValidator = (instance: unknown, instanceLocation: JSONPointer) => {
      return indirectValidator(instance, instanceLocation)
    }
    cachedValidatorsBySchema.set(schema, boundValidator)

    // push state
    parentSchemas.push(schema)

    indirectValidator = makeValidatorForSchema(schema, schemaLocation)

    // pop state
    parentSchemas.pop()

    return boundValidator
  }

  const makeValidatorForSchema = (schema: DereferencedJSONSchemaObjectDraft2020_12, schemaLocation: JSONPointer) => {
    // TODO: allow passing handler for custom keywords
    let validatorsByKeyword: { [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]: KeywordValidator } = {}
    const metaSchema = metaSchemaForSchema(schema)
    const vocabularyKeys = Object.keys(metaSchema.$vocabulary ?? {})
    for (const [vocabularyURI, validators] of Object.entries(configuration.validatatorsByKeywordByVocabulary)) {
      if (vocabularyKeys.includes(vocabularyURI)) {
        validatorsByKeyword = {
          ...validatorsByKeyword,
          ...validators
        }
      }
    }
    for (const [vocabularyKey, vocabularyRequired] of Object.entries(metaSchema.$vocabulary ?? {})) {
      if (!Object.keys(configuration.validatatorsByKeywordByVocabulary).includes(vocabularyKey)) {
        // unknown vocabulary
        if (vocabularyRequired) {
          throw new SchemaError(`Unsupported vocabulary: ${vocabularyKey}`)
        }
      }
    }

    const boundKeywordValidators = Object.entries(validatorsByKeyword)
      .map(([keyword, validator]) => validatorForSchemaKeyword(schema, schemaLocation, keyword, validator))
      .filter((validator) => typeof validator === 'function')

    return (instance: any, instanceLocation: JSONPointer): Output => {
      let outputs: Output[] = []
      let accumulatedAnnotationResults: Record<string, any> = {}
      for (const boundKeywordValidator of boundKeywordValidators) {
        const output = boundKeywordValidator(instance, instanceLocation, accumulatedAnnotationResults)
        outputs.push(output)
        if ('annotationResults' in output) {
          accumulatedAnnotationResults = reduceAnnotationResults(accumulatedAnnotationResults, output.annotationResults)
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
          instanceLocation: instanceLocation,
          annotationResults: accumulatedAnnotationResults
        }
      } else {
        if (invalidOutputs.length === 1) {
          return invalidOutputs[0]
        } else {
          return {
            valid: false,
            schemaLocation,
            instanceLocation,
            message: 'Invalid value',
            errors: invalidOutputs
          }
        }
      }
    }
  }

  const validatorForSchemaKeyword = (
    schema: object,
    schemaLocation: JSONPointer,
    schemaKeyword: string,
    keywordValidator: KeywordValidator
  ): BoundValidatorWithAnnotationResults => {
    if (!(schemaKeyword in schema)) {
      return null
    }

    const keywordCache = cachedValidatorsBySchemaByKeyword[schemaKeyword] ?? new Map()
    cachedValidatorsBySchemaByKeyword[schemaKeyword] = keywordCache

    let validator = keywordCache.get(schema)
    if (validator) {
      return validator
    }

    validator = keywordValidator(schema, schemaLocation, { failFast, validatorForSchema })

    keywordCache.set(schema, validator)
    return validator
  }

  // TODO: handle unsupported meta schema
  const metaSchemaForSchema = (schema: object) => {
    let metaSchemaURI
    for (let i = parentSchemas.length - 1; i >= 0; i--) {
      if (cachedMetaSchemasBySchema.has(schema)) {
        return cachedMetaSchemasBySchema.get(schema)
      }

      const parentSchema = parentSchemas[i]
      if (typeof parentSchema === 'object' && '$schema' in parentSchema) {
        metaSchemaURI = parentSchema['$schema']
        break
      }
    }
    if (!metaSchemaURI) {
      metaSchemaURI = configuration.defaultMetaSchemaURI
    }

    const metaSchema = configuration.dereferenceJSONSchema({ $ref: metaSchemaURI }, { retrieve: options.retrieve })

    cachedMetaSchemasBySchema.set(schema, metaSchema)
    return metaSchema
  }

  const validator = validatorForSchema(schema, '')
  return (instance: unknown) => {
    const output = validator(instance, '')
    if (!output.valid) {
      throw new ValidationError((output as InvalidOutput).message ?? 'Invalid JSON value', { output })
    }
  }
}
