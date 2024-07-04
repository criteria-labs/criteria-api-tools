import type { JSONPointer } from '@criteria/json-pointer'
import { SchemaIndex, metaSchemaIDDraft04, metaSchemaIDDraft06, metaSchemaIDDraft07 } from '@criteria/json-schema'
import { BoundValidator, BoundValidatorWithAnnotationResults } from './BoundValidator'
import { FlagOutput, InvalidVerboseOutput, OutputFormat, VerboseOutput } from './Output'
import { annotationResultsReducerForMetaSchemaID } from './annotationResultsReducerForMetaSchemaID'
import { booleanValidator } from './booleanValidator'
import { JSONSchemaKeyword, JSONSchemaKeywordValidator, ValidatorContext } from './keywordValidators'

// types for binders
export type BoundValidatorForSchema = (schema: object | boolean, schemaPath: JSONPointer[]) => BoundValidator
export type BoundValidatorForSchemaKeyword = (
  schema: object | boolean,
  schemaPath: JSONPointer[],
  schemaKeyword: JSONSchemaKeyword,
  vocabularyValidator: JSONSchemaKeywordValidator
) => BoundValidatorWithAnnotationResults | null

export function validatorBinder(
  index: SchemaIndex,
  {
    outputFormat,
    failFast,
    validatorsForMetaSchemaID
  }: {
    outputFormat: OutputFormat
    failFast: boolean
    validatorsForMetaSchemaID: (uri: string) => { [Keyword in JSONSchemaKeyword]: JSONSchemaKeywordValidator }
  }
): BoundValidatorForSchema {
  // TODO: ignore cache for dynamic
  const cache = new Map<object, BoundValidator>()
  const validatorInfoForSchema = (
    schema: object | boolean,
    schemaPath: JSONPointer[]
  ): { validator: BoundValidator; isDynamic: boolean } => {
    if (typeof schema === 'boolean') {
      return {
        validator: booleanValidator(schema, schemaPath, { outputFormat }),
        isDynamic: false
      }
    }

    if (cache.has(schema)) {
      return {
        validator: cache.get(schema),
        isDynamic: false
      }
    }

    let validator: BoundValidator
    const indirectValidator = (instance: unknown, instanceLocation: JSONPointer) => {
      return validator(instance, instanceLocation)
    }
    cache.set(schema, indirectValidator)

    const metaSchemaID = index.infoForIndexedObject(schema).metadata.metaSchemaID
    const vocabularyValidators = validatorsForMetaSchemaID(metaSchemaID)
    const annotationResultsReducer = annotationResultsReducerForMetaSchemaID(metaSchemaID)

    let isChildDynamic = false
    const validatorForSchema = (schema: object | boolean, schemaPath: JSONPointer[]) => {
      const { validator, isDynamic } = validatorInfoForSchema(schema, schemaPath)
      isChildDynamic = isDynamic
      return validator
    }

    // draft 04/06/07: ref overrides any sibling keywords
    const keywordsFilter =
      (metaSchemaID === metaSchemaIDDraft04 ||
        metaSchemaID === metaSchemaIDDraft06 ||
        metaSchemaID === metaSchemaIDDraft07) &&
      '$ref' in schema
        ? (keyword: string) => keyword === '$ref'
        : (keyword: string) => true

    const boundKeywordValidators = Object.entries(vocabularyValidators)
      .filter(([keyword, vocabularyValidator]) => keywordsFilter(keyword))
      .map(([keyword, vocabularyValidator]) => {
        return boundValidatorForSchemaKeyword(schema, schemaPath, keyword, vocabularyValidator, {
          outputFormat,
          failFast,
          validatorForSchema,
          index
        })
      })
      .filter((validator) => typeof validator === 'function')

    const schemaLocation = schemaPath.join('') as JSONPointer
    if (outputFormat === 'flag') {
      validator = (instance: unknown, instanceLocation: JSONPointer) => {
        let outputs: VerboseOutput[] = []
        let accumulatedAnnotationResults: Record<string, any> = {}
        for (const boundKeywordValidator of boundKeywordValidators) {
          const output = boundKeywordValidator(instance, instanceLocation, accumulatedAnnotationResults)
          if (!output.valid && failFast) {
            return output
          }

          outputs.push(output as VerboseOutput)
          if ('annotationResults' in output) {
            accumulatedAnnotationResults = annotationResultsReducer(
              accumulatedAnnotationResults,
              output.annotationResults ?? {}
            )
          }
        }

        return reduceFlagOutputs(outputs, schemaLocation, instanceLocation, accumulatedAnnotationResults)
      }
    } else {
      validator = (instance: unknown, instanceLocation: JSONPointer) => {
        let outputs: VerboseOutput[] = []
        let accumulatedAnnotationResults: Record<string, any> = {}
        for (const boundKeywordValidator of boundKeywordValidators) {
          const output = boundKeywordValidator(instance, instanceLocation, accumulatedAnnotationResults)
          if (!output.valid && failFast) {
            return output
          }

          outputs.push(output as VerboseOutput)
          if ('annotationResults' in output) {
            accumulatedAnnotationResults = annotationResultsReducer(
              accumulatedAnnotationResults,
              output.annotationResults ?? {}
            )
          }
        }

        return reduceVerboseOutputs(outputs, schemaLocation, instanceLocation, accumulatedAnnotationResults)
      }
    }

    const isDynamic = schemaPath.includes('/$dynamicRef') || isChildDynamic

    if (isDynamic) {
      cache.delete(schema)
    } else {
      cache.set(schema, indirectValidator)
    }

    return { validator, isDynamic }
  }

  return (schema: object | boolean, schemaPath: JSONPointer[]) => {
    const { validator } = validatorInfoForSchema(schema, schemaPath)
    return validator
  }
}

function reduceFlagOutputs(
  outputs: FlagOutput[],
  schemaLocation: JSONPointer,
  instanceLocation: JSONPointer,
  annotationResults: Record<string, any>
): FlagOutput {
  if (outputs.every((output) => output.valid)) {
    return { valid: true, schemaLocation, instanceLocation, annotationResults }
  } else {
    return { valid: false }
  }
}

function reduceVerboseOutputs(
  outputs: VerboseOutput[],
  schemaLocation: JSONPointer,
  instanceLocation: JSONPointer,
  annotationResults: Record<string, any>
): VerboseOutput {
  if (outputs.every((output) => output.valid)) {
    return {
      valid: true,
      schemaLocation,
      instanceLocation,
      annotationResults
    }
  } else {
    if (outputs.length === 1) {
      return outputs[0] as InvalidVerboseOutput
    } else {
      const errors = outputs.filter((output) => !output.valid) as InvalidVerboseOutput[]
      return {
        valid: false,
        schemaLocation,
        instanceLocation,
        message: errors.map((output) => (output as InvalidVerboseOutput).message).join('; '),
        errors: errors
      }
    }
  }
}

export function boundValidatorForSchemaKeyword(
  schema: object,
  schemaPath: JSONPointer[],
  schemaKeyword: JSONSchemaKeyword,
  vocabularyValidator: JSONSchemaKeywordValidator,
  context: ValidatorContext
): BoundValidatorWithAnnotationResults {
  if (!(schemaKeyword in schema)) {
    return null
  }

  return vocabularyValidator(schema, schemaPath, context)
}
