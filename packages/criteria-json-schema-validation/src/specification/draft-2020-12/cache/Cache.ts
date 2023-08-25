import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { Validator } from '../../types'

export class Cache {
  private readonly boundValidatorsBySchema = new Map<DereferencedJSONSchemaObjectDraft2020_12, Validator>()
  private readonly boundValidatorsBySchemaByKeyword: {
    [Keyword in keyof DereferencedJSONSchemaObjectDraft2020_12]: Map<
      DereferencedJSONSchemaObjectDraft2020_12,
      Validator
    >
  } = {}

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
}
