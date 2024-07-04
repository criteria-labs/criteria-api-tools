import {
  metaSchemaIDDraft04,
  metaSchemaIDDraft06,
  metaSchemaIDDraft07,
  metaSchemaIDDraft2020_12
} from '@criteria/json-schema'
import { reduceAnnotationResults as reduceAnnotationResultsDraft04 } from '../specification/draft-04/vocabularies/reduceAnnotationResults'
import {
  reduceAnnotationResults as reduceAnnotationResultsDraft06,
  reduceAnnotationResults as reduceAnnotationResultsDraft07
} from '../specification/draft-06/vocabularies/reduceAnnotationResults'
import { reduceAnnotationResults as reduceAnnotationResultsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/reduceAnnotationResults'

export function annotationResultsReducerForMetaSchemaID(
  metaSchemaID: string
): (lhs: Record<string, any>, rhs: Record<string, any>) => Record<string, any> {
  switch (metaSchemaID) {
    case metaSchemaIDDraft04:
      return reduceAnnotationResultsDraft04
    case metaSchemaIDDraft06:
      return reduceAnnotationResultsDraft06
    case metaSchemaIDDraft07:
      return reduceAnnotationResultsDraft07
    case metaSchemaIDDraft2020_12:
      return reduceAnnotationResultsDraft2020_12
    default:
      return (lhs, rhs) => Object.assign({}, lhs, rhs)
  }
}
