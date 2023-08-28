import { DereferencedJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { ValidationContext } from './ValidationContext'
import { InstanceContext } from './InstanceContext'

export function jsonValidator(
  schema: DereferencedJSONSchemaDraft2020_12,
  {
    failFast,
    defaultMetaSchemaURI,
    retrieveMetaSchema
  }: {
    failFast: boolean
    defaultMetaSchemaURI?: string
    retrieveMetaSchema?: (uri: string) => any
  }
) {
  const context = new ValidationContext({
    failFast,
    defaultMetaSchemaURI: defaultMetaSchemaURI ?? 'https://json-schema.org/draft/2020-12/schema',
    retrieveMetaSchema
  })
  const validator = context.validatorForSchema(schema, '')
  return (instance: unknown) => {
    const output = validator(instance, new InstanceContext(''))
    if (!output.valid) {
      throw new Error('Invalid JSON ' + JSON.stringify(output, null, '  '))
    }
  }
}
