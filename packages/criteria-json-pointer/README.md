# JSON Pointer

Implementation of JSON Pointer ([RFC 6901](https://www.rfc-editor.org/rfc/rfc6901)).

## Installation

```
npm install @criteria/json-pointer
```

## Usage

Evaluate a JSON Pointer:

```
import { evaluateJSONPointer } from '@criteria/json-pointer'

const str = '#/foo'
const document = {
    foo: true
}

const value = evaluateJSONPointer(str, document)
// value === true
```

Validate that a string is a JSON Pointer:

```
import { validateJSONPointer } from '@criteria/json-pointer'

const str = '#/foo'

try {
  validateJSONPointer(str)
  // valid
} catch (err) {
  // not valid
}
```
