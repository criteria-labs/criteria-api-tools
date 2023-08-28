import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../util/JSONPointer'
import { AnnotationResultsByKeyword, combineAnnotationResults } from '../output'

export class InstanceContext {
  readonly instanceLocation: JSONPointer
  private annotationResults: AnnotationResultsByKeyword
  constructor(instanceLocation: JSONPointer) {
    this.instanceLocation = instanceLocation
    this.annotationResults = {}
  }

  annotationResultForKeyword(keyword: keyof DereferencedJSONSchemaObjectDraft2020_12): any | undefined {
    return this.annotationResults[keyword]
  }

  addAnnotationResults(newAnnotationResults: AnnotationResultsByKeyword) {
    this.annotationResults = combineAnnotationResults([this.annotationResults, newAnnotationResults])
  }

  appendingInstanceLocation(suffix: JSONPointer) {
    return new InstanceContext(`${this.instanceLocation}/${suffix}`)
  }

  clone() {
    const result = new InstanceContext(this.instanceLocation)
    result.annotationResults = { ...this.annotationResults }
    return result
  }
}
