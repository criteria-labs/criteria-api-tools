import { metaSchemaID as metaSchemaIDDraft04 } from '../draft-04'
import { metaSchemaID as metaSchemaIDDraft06 } from '../draft-06'
import { metaSchemaID as metaSchemaIDDraft07 } from '../draft-07'
import { metaSchemaID as metaSchemaIDDraft2020_12 } from '../draft-2020-12'
import { ReferenceInfo } from '../schema-index/types'
import { mergeReferenceInto as mergeReferenceIntoDraft04 } from '../specification/draft-04/mergeReferenceInto'
import { mergeReferenceInto as mergeReferenceIntoDraft06 } from '../specification/draft-06/mergeReferenceInto'
import { mergeReferenceInto as mergeReferenceIntoDraft07 } from '../specification/draft-07/mergeReferenceInto'
import { mergeReferenceInto as mergeReferenceIntoDraft2020_12 } from '../specification/draft-2020-12/mergeReferenceInto'
import { URI } from '../util/uri'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

const mergeReferenceInto = (metaSchemaID: string) => {
  switch (metaSchemaID) {
    case metaSchemaIDDraft04:
      return mergeReferenceIntoDraft04
    case metaSchemaIDDraft06:
      return mergeReferenceIntoDraft06
    case metaSchemaIDDraft07:
      return mergeReferenceIntoDraft07
    case metaSchemaIDDraft2020_12:
      return mergeReferenceIntoDraft2020_12
    default:
      return mergeReferenceIntoDraft2020_12
  }
}

export function mergeReference<Metadata extends { metaSchemaID: URI }>(
  reference: { $ref: string },
  info: ReferenceInfo<Metadata>,
  dereferencedValue: any,
  referenceMergePolicy: ReferenceMergePolicy
) {
  const { $ref, ...siblings } = reference
  const target = {}
  mergeReferenceInto(info.metadata.metaSchemaID)(target, dereferencedValue, siblings, referenceMergePolicy)
  return target
}
