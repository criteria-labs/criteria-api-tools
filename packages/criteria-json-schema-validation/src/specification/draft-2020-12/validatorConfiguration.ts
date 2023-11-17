import { dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { ValidatorConfiguration } from '../../validation/jsonValidator'

const configuration: ValidatorConfiguration = {
  defaultMetaSchemaURI: 'https://json-schema.org/draft/2020-12/schema',
  dereferenceJSONSchema: dereferenceJSONSchemaDraft2020_12
}

export default configuration
