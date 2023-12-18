import { ReferenceInfo } from '../schema-index/types'
import { mergeReferenceInto as mergeReferenceIntoDraft04 } from '../specification/draft-04/mergeReferenceInto'
import { mergeReferenceInto as mergeReferenceIntoDraft06 } from '../specification/draft-06/mergeReferenceInto'
import { mergeReferenceInto as mergeReferenceIntoDraft2020_12 } from '../specification/draft-2020-12/mergeReferenceInto'
import { URI } from '../util/uri'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

const mergeReferenceInto = (metaSchemaURI: string) => {
  switch (metaSchemaURI) {
    case 'http://json-schema.org/draft-04/schema#':
      return mergeReferenceIntoDraft04
    case 'http://json-schema.org/draft-06/schema#':
      return mergeReferenceIntoDraft06
    case 'https://json-schema.org/draft/2020-12/schema':
      return mergeReferenceIntoDraft2020_12
    default:
      return mergeReferenceIntoDraft2020_12
  }
}

export function mergeReference<Metadata extends { metaSchemaURI: URI }>(
  reference: { $ref: string },
  info: ReferenceInfo<Metadata>,
  dereferencedValue: any,
  referenceMergePolicy: ReferenceMergePolicy
) {
  const { $ref, ...siblings } = reference
  const target = {}
  mergeReferenceInto(info.metadata.metaSchemaURI)(target, dereferencedValue, siblings, referenceMergePolicy)
  return target
}
