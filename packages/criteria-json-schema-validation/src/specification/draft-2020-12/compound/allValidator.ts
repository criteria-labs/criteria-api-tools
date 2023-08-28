import { InvalidOutput, Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function allValidator(validators: Validator[], context: ValidationContext): Validator {
  const failFast = context.failFast
  return (instance: unknown, instanceContext: InstanceContext): Output => {
    let outputs = []
    for (const validator of validators) {
      const output = validator(instance, instanceContext)
      outputs.push(output)
      if (!output.valid && failFast) {
        return output
      }
    }

    const invalidOutputs = outputs.filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        instanceLocation: instanceContext.instanceLocation
      }
    } else {
      return {
        valid: false,
        errors: invalidOutputs
      }
    }
  }
}
