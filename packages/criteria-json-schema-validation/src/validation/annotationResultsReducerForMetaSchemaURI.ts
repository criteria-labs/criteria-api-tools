import {
  metaSchemaURIDraft04,
  metaSchemaURIDraft06,
  metaSchemaURIDraft07,
  metaSchemaURIDraft2020_12
} from '@criteria/json-schema'
import { reduceAnnotationResults as reduceAnnotationResultsDraft04 } from '../specification/draft-04/vocabularies/reduceAnnotationResults'
import {
  reduceAnnotationResults as reduceAnnotationResultsDraft06,
  reduceAnnotationResults as reduceAnnotationResultsDraft07
} from '../specification/draft-06/vocabularies/reduceAnnotationResults'
import { reduceAnnotationResults as reduceAnnotationResultsDraft2020_12 } from '../specification/draft-2020-12/vocabularies/reduceAnnotationResults'

export function annotationResultsReducerForMetaSchemaURI(
  metaSchemaURI: string
): (lhs: Record<string, any>, rhs: Record<string, any>) => Record<string, any> {
  switch (metaSchemaURI) {
    case metaSchemaURIDraft04:
      return reduceAnnotationResultsDraft04
    case metaSchemaURIDraft06:
      return reduceAnnotationResultsDraft06
    case metaSchemaURIDraft07:
      return reduceAnnotationResultsDraft07
    case metaSchemaURIDraft2020_12:
      return reduceAnnotationResultsDraft2020_12
    default:
      return (lhs, rhs) => Object.assign({}, lhs, rhs)
  }
}
