import { DereferencedJSONSchemaDraft2020_12, dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { jsonValidator as jsonValidatorDraft2020_12 } from './specification/draft-2020-12'

interface Options {
  failFast: boolean
  defaultMetaSchemaURI?: string
  retrieveMetaSchema?: (uri: string) => any
}

export function validateJSON(instance: unknown, schema: DereferencedJSONSchemaDraft2020_12, options: Options) {
  const validator = jsonValidatorDraft2020_12(schema, options)
  validator(instance)
}
