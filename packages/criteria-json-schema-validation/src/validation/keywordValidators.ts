import { JSONSchemaDraft04, JSONSchemaDraft2020_12, SchemaIndex, metaSchemaURIDraft04 } from '@criteria/json-schema'
import { SchemaError } from '../errors/SchemaError'
import { coreValidators as coreValidatorsDraft04 } from '../specification/draft-04/vocabularies/core'
import { validationValidators as validationValidatorsDraft04 } from '../specification/draft-04/vocabularies/validation'
import { applicatorValidators as applicatorValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/applicator'
import { coreValidators as coreValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/core'
import { unevaluatedValidators as unevaluatedValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/unevaluated'
import { validationValidators as validationValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/validation'
import { formatAssertionValidators as formatAssertionValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/format-assertion'
import { JSONPointer } from '../util/JSONPointer'
import { BoundValidatorWithAnnotationResults } from './BoundValidator'
import { BoundValidatorForSchema } from './validatorBinder'

export type JSONSchemaKeyword = keyof JSONSchemaDraft2020_12 | keyof JSONSchemaDraft04

export type ValidatorContext = {
  failFast: boolean
  validatorForSchema: BoundValidatorForSchema
  index: SchemaIndex
}

export type JSONSchemaKeywordValidator = (
  schema: object | boolean,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) => BoundValidatorWithAnnotationResults

export type JSONSchemaKeywordValidators = {
  [Keyword in JSONSchemaKeyword]: JSONSchemaKeywordValidator
}

export type KeywordValidatorsForMetaSchemaURI = (metaSchemaURI: string) => JSONSchemaKeywordValidators

export function keywordValidatorsForMetaSchemaURIFactory({
  assertFormat,
  retrieve
}: {
  assertFormat: boolean
  retrieve: (uri: string) => { $vocabulary?: { [uri: string]: boolean } }
}): KeywordValidatorsForMetaSchemaURI {
  const cache = new Map<string, JSONSchemaKeywordValidators>()
  return (metaSchemaURI: string) => {
    if (cache.has(metaSchemaURI)) {
      return cache.get(metaSchemaURI)
    }

    if (metaSchemaURI === metaSchemaURIDraft04) {
      const validators = {
        ...coreValidatorsDraft04,
        ...validationValidatorsDraft04
      }
      cache.set(metaSchemaURI, validators)
      return validators
    }

    let validators: JSONSchemaKeywordValidators = {}

    // order is important here due to keyword interdependence
    // applicator before validation, so maxContains and minContains can access contains annotation results
    // add unevaluated keywords last
    const draft2020_12Validators = {
      'https://json-schema.org/draft/2020-12/vocab/core': coreValidatorsDraft2020_12,
      'https://json-schema.org/draft/2020-12/vocab/applicator': applicatorValidatorsDraft2020_12,
      'https://json-schema.org/draft/2020-12/vocab/validation': validationValidatorsDraft2020_12,
      'https://json-schema.org/draft/2020-12/vocab/meta-data': {},
      'https://json-schema.org/draft/2020-12/vocab/format-annotation': assertFormat
        ? formatAssertionValidatorsDraft2020_12
        : {},
      'https://json-schema.org/draft/2020-12/vocab/format-assertion': formatAssertionValidatorsDraft2020_12,
      'https://json-schema.org/draft/2020-12/vocab/content': {},
      'https://json-schema.org/draft/2020-12/vocab/unevaluated': unevaluatedValidatorsDraft2020_12
    }

    const metaSchema = retrieve(metaSchemaURI)
    const vocabularies = Object.keys(metaSchema.$vocabulary ?? {})

    for (const [vocabulary, vocabularyValidators] of Object.entries(draft2020_12Validators)) {
      if (vocabularies.includes(vocabulary)) {
        validators = {
          ...validators,
          ...vocabularyValidators
        }
      }
    }

    for (const [vocabularyKey, vocabularyRequired] of Object.entries(metaSchema.$vocabulary ?? {})) {
      if (!Object.keys(draft2020_12Validators).includes(vocabularyKey)) {
        // unknown vocabulary
        if (vocabularyRequired) {
          throw new SchemaError(`Unsupported vocabulary: ${vocabularyKey}`)
        }
      }
    }

    cache.set(metaSchemaURI, validators)
    return validators
  }
}
