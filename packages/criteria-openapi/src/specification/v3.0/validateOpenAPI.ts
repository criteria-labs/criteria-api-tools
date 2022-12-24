interface Options {
  strict?: boolean
}

export function validateOpenAPI(value: any, options?: Options) {
  return openAPIValidator(options)(value)
}

export function openAPIValidator(options?: Options): (value: any) => void {
  return (value: any) => {}
}
