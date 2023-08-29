import { dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { ValidatorConfiguration } from '../../validation/jsonValidator'
import { applicatorValidators } from './vocabularies/applicator'
import { coreValidators } from './vocabularies/core'
import { unevaluatedValidators } from './vocabularies/unevaluated'
import { validationValidators } from './vocabularies/validation'

// order is important here due to keyword interdependence
// applicator before validation, so maxContains and minContains can access contains annotation results
// add unevaluated keywords last
const configuration: ValidatorConfiguration = {
  defaultMetaSchemaURI: 'https://json-schema.org/draft/2020-12/schema',
  dereferenceJSONSchema: dereferenceJSONSchemaDraft2020_12,
  validatatorsByKeywordByVocabulary: {
    'https://json-schema.org/draft/2020-12/vocab/core': coreValidators,
    'https://json-schema.org/draft/2020-12/vocab/applicator': applicatorValidators,
    'https://json-schema.org/draft/2020-12/vocab/validation': validationValidators,
    'https://json-schema.org/draft/2020-12/vocab/meta-data': {},
    'https://json-schema.org/draft/2020-12/vocab/format-annotation': {},
    'https://json-schema.org/draft/2020-12/vocab/format-assertion': {},
    'https://json-schema.org/draft/2020-12/vocab/content': {},
    'https://json-schema.org/draft/2020-12/vocab/unevaluated': unevaluatedValidators
  }
}

export default configuration
