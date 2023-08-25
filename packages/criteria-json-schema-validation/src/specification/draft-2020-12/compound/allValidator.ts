import { JSONPointer } from '../../../util/JSONPointer'
import { summarizedOutput } from '../../output'
import { Validator } from '../../types'

export function allValidator(validators: Validator[], { failFast }: { failFast: boolean }): Validator {
  return (instance: unknown, instanceLocation: JSONPointer) => {
    let outputs = []
    for (const validator of validators) {
      const output = validator(instance, instanceLocation)
      outputs.push(output)
      if (!output.valid && failFast) {
        break
      }
    }
    return summarizedOutput(outputs)
  }
}
