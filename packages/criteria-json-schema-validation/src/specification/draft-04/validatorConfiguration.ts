import { dereferenceJSONSchemaDraft04 } from '@criteria/json-schema'
import { ValidatorConfiguration } from '../../validation/jsonValidator'

const configuration: ValidatorConfiguration = {
  defaultMetaSchemaURI: 'http://json-schema.org/draft-04/schema#',
  dereferenceJSONSchema: dereferenceJSONSchemaDraft04
}

export default configuration
