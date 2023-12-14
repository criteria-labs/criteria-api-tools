import { SchemaIndex, metaSchemaURIDraft04 } from '@criteria/json-schema'
import { reduceAnnotationResults } from '../specification/draft-2020-12/vocabularies/reduceAnnotationResults'
import { JSONPointer } from '../util/JSONPointer'
import { formatList } from '../util/formatList'
import { BoundValidator, BoundValidatorWithAnnotationResults } from './BoundValidator'
import { InvalidOutput, Output } from './Output'
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
    failFast,
    validatorsForMetaSchemaURI
  }: {
    failFast: boolean
    validatorsForMetaSchemaURI: (uri: string) => { [Keyword in JSONSchemaKeyword]: JSONSchemaKeywordValidator }
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
        validator: booleanValidator(schema, schemaPath),
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

    const metaSchemaURI = index.infoForIndexedObject(schema).metadata.metaSchemaURI
    const vocabularyValidators = validatorsForMetaSchemaURI(metaSchemaURI)

    let isChildDynamic = false
    const validatorForSchema = (schema: object | boolean, schemaPath: JSONPointer[]) => {
      const { validator, isDynamic } = validatorInfoForSchema(schema, schemaPath)
      isChildDynamic = isDynamic
      return validator
    }

    // draft 04: ref overrides any sibling keywords
    const keywordsFilter =
      metaSchemaURI === metaSchemaURIDraft04 && '$ref' in schema
        ? (keyword: string) => keyword === '$ref'
        : (keyword: string) => true

    const boundKeywordValidators = Object.entries(vocabularyValidators)
      .filter(([keyword, vocabularyValidator]) => keywordsFilter(keyword))
      .map(([keyword, vocabularyValidator]) => {
        return boundValidatorForSchemaKeyword(schema, schemaPath, keyword, vocabularyValidator, {
          failFast,
          validatorForSchema,
          index
        })
      })
      .filter((validator) => typeof validator === 'function')

    validator = boundValidatorWithSchema(schema, schemaPath, {
      failFast,
      boundKeywordValidators,
      index
    })

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

function boundValidatorWithSchema(
  schema: object,
  schemaPath: JSONPointer[],
  {
    failFast,
    boundKeywordValidators,
    index
  }: {
    failFast: boolean
    boundKeywordValidators: BoundValidatorWithAnnotationResults[]
    index: SchemaIndex
  }
): BoundValidator {
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: unknown, instanceLocation: JSONPointer) => {
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
          message: formatList(
            invalidOutputs.map((output) => output.message),
            'and'
          ),
          errors: invalidOutputs
        }
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
