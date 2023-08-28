import { DereferencedJSONSchemaObjectDraft2020_12, dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Validator } from '../../types'

export class Cache {
  private readonly boundValidatorsBySchema = new Map<DereferencedJSONSchemaObjectDraft2020_12, Validator>()
  private readonly boundValidatorsBySchemaByKeyword: {
    [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]: Map<
      DereferencedJSONSchemaObjectDraft2020_12,
      Validator
    >
  } = {}
  private readonly metaSchemasBySchema = new Map<
    DereferencedJSONSchemaObjectDraft2020_12,
    DereferencedJSONSchemaObjectDraft2020_12
  >()

  readonly retrieveMetaSchema: (uri: string) => any
  constructor(retrieveMetaSchema: (uri: string) => any) {
    this.retrieveMetaSchema = retrieveMetaSchema
  }

  validatorForSchema(schema: DereferencedJSONSchemaObjectDraft2020_12): Validator {
    return this.boundValidatorsBySchema.get(schema)
  }

  setValidatorForSchema(schema: DereferencedJSONSchemaObjectDraft2020_12, validator: Validator) {
    this.boundValidatorsBySchema.set(schema, validator)
  }

  validatorForSchemaKeyword(
    schema: DereferencedJSONSchemaObjectDraft2020_12,
    keyword: keyof DereferencedJSONSchemaObjectDraft2020_12
  ): Validator {
    const map = this.boundValidatorsBySchemaByKeyword[keyword] ?? new Map()
    this.boundValidatorsBySchemaByKeyword[keyword] = map

    return map.get(schema)
  }

  setValidatorForSchemaKeyword(
    schema: DereferencedJSONSchemaObjectDraft2020_12,
    keyword: keyof DereferencedJSONSchemaObjectDraft2020_12,
    validator: Validator
  ) {
    const map = this.boundValidatorsBySchemaByKeyword[keyword] ?? new Map()
    this.boundValidatorsBySchemaByKeyword[keyword] = map

    map.set(schema, validator)
  }

  metaSchemaForSchemas(
    schemas: DereferencedJSONSchemaObjectDraft2020_12[],
    { defaultMetaSchemaURI }: { defaultMetaSchemaURI: string }
  ) {
    const currentSchema = schemas[schemas.length - 1]

    let metaSchema = this.metaSchemasBySchema.get(currentSchema)
    if (metaSchema) {
      return metaSchema
    }

    let metaSchemaURI
    for (let i = schemas.length - 1; i >= 0; i--) {
      const schema = schemas[i]
      if (typeof schema === 'object' && '$schema' in schema && typeof schema['$schema'] === 'string') {
        metaSchemaURI = schema['$schema']
        break
      } else if (this.metaSchemasBySchema.has(schema)) {
        return this.metaSchemasBySchema.get(schema)
      }
    }
    if (!metaSchemaURI) {
      metaSchemaURI = defaultMetaSchemaURI
    }

    metaSchema = dereferenceJSONSchemaDraft2020_12({ $ref: metaSchemaURI }, { retrieve: this.retrieveMetaSchema })
    this.metaSchemasBySchema.set(currentSchema, metaSchema)
    return metaSchema
  }
}
