import type { JSONPointer } from '@criteria/json-pointer'
import {
  JSONSchemaDraft04,
  JSONSchemaDraft06,
  JSONSchemaDraft2020_12,
  SchemaIndex,
  metaSchemaIDDraft04,
  metaSchemaIDDraft06,
  metaSchemaIDDraft07
} from '@criteria/json-schema'
import { SchemaError } from '../errors/SchemaError'
import { coreValidators as coreValidatorsDraft04 } from '../specification/draft-04/vocabularies/core'
import { validationValidators as validationValidatorsDraft04 } from '../specification/draft-04/vocabularies/validation'
import { coreValidators as coreValidatorsDraft06 } from '../specification/draft-06/vocabularies/core'
import { validationValidators as validationValidatorsDraft06 } from '../specification/draft-06/vocabularies/validation'
import { coreValidators as coreValidatorsDraft07 } from '../specification/draft-07/vocabularies/core'
import { validationValidators as validationValidatorsDraft07 } from '../specification/draft-07/vocabularies/validation'
import { applicatorValidators as applicatorValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/applicator'
import { coreValidators as coreValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/core'
import { formatAssertionValidators as formatAssertionValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/format-assertion'
import { unevaluatedValidators as unevaluatedValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/unevaluated'
import { validationValidators as validationValidatorsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/validation'
import { BoundValidatorWithAnnotationResults } from './BoundValidator'
import { OutputFormat } from './Output'
import { BoundValidatorForSchema } from './validatorBinder'

export type JSONSchemaKeyword = keyof JSONSchemaDraft04 | keyof JSONSchemaDraft06 | keyof JSONSchemaDraft2020_12

export type ValidatorContext = {
  outputFormat: OutputFormat
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

export type KeywordValidatorsForMetaSchemaID = (metaSchemaID: string) => JSONSchemaKeywordValidators

export function keywordValidatorsForMetaSchemaIDFactory({
  assertFormat,
  retrieve
}: {
  assertFormat: boolean
  retrieve: (uri: string) => { $vocabulary?: { [uri: string]: boolean } }
}): KeywordValidatorsForMetaSchemaID {
  const cache = new Map<string, JSONSchemaKeywordValidators>()
  return (metaSchemaID: string) => {
    if (cache.has(metaSchemaID)) {
      return cache.get(metaSchemaID)
    }

    if (metaSchemaID === metaSchemaIDDraft04) {
      const validators = {
        ...coreValidatorsDraft04,
        ...validationValidatorsDraft04
      }
      cache.set(metaSchemaID, validators)
      return validators
    }

    if (metaSchemaID === metaSchemaIDDraft06) {
      const validators = {
        ...coreValidatorsDraft06,
        ...validationValidatorsDraft06
      }
      cache.set(metaSchemaID, validators)
      return validators
    }

    if (metaSchemaID === metaSchemaIDDraft07) {
      const validators = {
        ...coreValidatorsDraft07,
        ...validationValidatorsDraft07
      }
      cache.set(metaSchemaID, validators)
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

    const metaSchema = retrieve(metaSchemaID)
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

    cache.set(metaSchemaID, validators)
    return validators
  }
}
