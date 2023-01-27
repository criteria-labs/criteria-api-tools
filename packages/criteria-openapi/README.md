# OpenAPI

TypeScript type definitions and functions for the [OpenAPI](https://www.openapis.org/) specification.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [JSON Schema compatibility](#json-schema-compatibility)
- [Usage](#usage)
  - [Importing type definitions](#importing-type-definitions)
  - [Dereferencing OpenAPI documents](#dereferencing-openapi-documents)
  - [Retrieving external documents](#retrieving-external-documents)
- [Acknowledgments](#acknowledgments)
- [License](#license)
- [About Criteria](#about-criteria)

## Overview

This package provides TypeScript type definitions and functions for working with OpenAPI documents. It is intended to be used by tooling authors, to build OpenAPI tools in TypeScript across various versions of the specification easily.

This package also contains functions to dereference OpenAPI documents into plain JavaScript objects according to the reference resolution rules of the specification.

The following versions are currently supported:

- [Version 3.0](https://spec.openapis.org/oas/v3.0.3)
- [Version 3.1](https://spec.openapis.org/oas/v3.1.0)

## Getting Started

Install OpenAPI using npm:

```sh
npm install @criteria/openapi
```

Let's define a minimal OpenAPI document in code to get started:

```ts
import { OpenAPI } from '@criteria/openapi/v3.1'

const openAPI: OpenAPI = {
  openapi: '3.1.0',
  info: {},
  paths: {
    '/people': {
      get: {
        responses: {
          '200': {
            $ref: '#/components/responses/PersonList'
          }
        }
      }
    }
  },
  components: {
    responses: {
      PersonList: {
        description: 'List of person objects',
        content: {
          'application/json' {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Person'
              }
            }
          }
        }
      }
    },
    schemas: {
      Person: {
        type: 'object',
        title: 'person',
        properties: {
          name: {
            $ref: '#/$defs/requiredString'
          },
          email: {
            $ref: '#/$defs/requiredString'
          }
        },
        $defs: {
          requiredString: {
            title: 'requiredString',
            type: 'string',
            minLength: 1
          }
        }
      }
    }
  }
}
```

Right now if we tried to inspect any responses of the `GET /people` operation we would get undefined:

```ts
console.log(openAPI.paths['/people'].get.responses['200'].content)
// undefined
```

We can use the `dereferenceOpenAPI()` function to transform our OpenAPI object with `$ref` values into plain JavaScript objects without any references:

```ts
import { OpenAPI, DereferencedOpenAPI, dereferenceOpenAPI } from '@criteria/openapi/v3.1'

const openAPI: OpenAPI = {
  /* same as above */
}

const dereferencedOpenAPI: DereferencedOpenAPI = dereferenceOpenAPI(openAPI)

console.log(JSON.stringify(openAPI.paths['/people'].get.responses['200'].content['application/json']))
// prints the Person schema
```

The return type of `dereferenceOpenAPI(openAPI)` is `DereferencedOpenAPI` instead of `OpenAPI`. This is a TypeScript type alias that replaces [Reference](https://spec.openapis.org/oas/v3.1.0#reference-object) objects with their dereferenced values.

## JSON Schema compatibility

The OpenAPI specification makes use of the [JSON Schema](https://json-schema.org/) specification to describe Schema objects, with some modifications. Starting with v3.1, the OpenAPI specification also supports explicitly specifying which dialect of JSON Schema to use, both globally using the `jsonSchemaDialect` field and per schema using the `$schema` keyword.

This package's supports of JSON Schema is described in this table:

| OpenAPI version | JSON Schema draft | Modifications                                                                              |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| v3.1            | Draft 2020-12     | See the [Schema](https://spec.openapis.org/oas/v3.1.0#schema-object) object specification. |
| v3.0            | Draft 04          | See the [Schema](https://spec.openapis.org/oas/v3.0.3#schema-object) object specification. |

## Installation

```sh
npm install @criteria/openapi
```

## Usage

### Importing type definitions

Type names are suffixed with the version that they correspond to:

```ts
import { OpenAPIv3_0, OpenAPIv3_1 } from '@criteria/openapi'

const fooOpenAPI: OpenAPIv3_0 = {
  openapi: '3.0.3'
}

const barOpenAPI: OpenAPIv3_1 = {
  openapi: '3.1.0'
}
```

If you only want to import types for a specific version, you can import more concise types from the version-specific module:

```ts
import { OpenAPI } from '@criteria/openapi/v3.0'

const openAPI: OpenAPI = {
  openapi: '3.0.3'
}
```

```ts
import { OpenAPI } from '@criteria/openapi/v3.1'

const openAPI: OpenAPI = {
  openapi: '3.1.0'
}
```

The `webhooks` field is a new field introduced in version 3.1. Trying to define webhooks on a v3.0 document is caught by the TypeScript compiler:

```ts
import { OpenAPIv3_0 } from '@criteria/json-schema'

const openAPI: OpenAPIv3_0 = {
  webhooks: {}
}
// 'webhooks' does not exist in type 'OpenAPI<Reference>'
```

### Dereferencing OpenAPI documents

Dereferencing refers to the process of transforming an OpenAPI document by replacing occurences of `$ref` with the actual component being referenced.

The `dereferenceOpenAPI(openAPI)` functions provided by this package observe the following behaviour:

- The OpenAPI document is treated as immutable. The return value is a copy of the input data.
- Object identity is maintained. The dereferenced OpenAPI document is the same JavaScript instance as the value that was referenced.
- Circular references are preserved. Recursive or circular references in the input OpenAPI document will be replicated in the dereferenced output.

The following example demonstrates this behaviour:

```ts
import { dereferenceOpenAPI } from '@criteria/openapi/v3.1'

const inputOpenAPI: OpenAPI = {
  openapi: '3.1.0'
  components: {
    schemas: {
      Person: {
        type: 'object',
        title: 'person',
        properties: {
          name: {
            $ref: '#/components/schemas/RequiredString'
          },
          children: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Person'
            }
          }
        }
      },
      RequiredString: {
        title: 'requiredString',
        type: 'string',
        minLength: 1
      }
    }
  }
}

const dereferencedOpenAPI = dereferenceOpenAPI(inputOpenAPI)

console.log(dereferencedOpenAPI === inputOpenAPI)
// false, input data is not mutated

console.log(dereferencedOpenAPI.components.schemas['Person'].properties.name === dereferencedOpenAPI.components.schemas['RequiredString'])
// true, object identity is maintained

console.log(dereferencedOpenAPI.components.schemas['Person'].properties.children.items === dereferencedOpenAPI.components.schemas['Person'])
// true, circular references are supported
```

### Retrieving external documents

It's common for API definition authors to organize complex OpenAPI definitions as multiple shared files. You can provide a custom retrieve function to `dereferenceOpenAPI()` in order to perform an filesystem or network operations.

The following example dereferences an OpenAPI document that references other files as relative paths from the same directory.

```ts
import { readFileSync } from 'fs'

const baseURI = resolve(__dirname, 'openapi.json')

const retrieve = (uri: string) => {
  const data = readFileSync(uri, { encoding: 'utf8' })
  return JSON.parse(data)
}

const dereferencedSchema = dereferenceJSONSchema(rootSchema, { baseURI, retrieve })
```

The argument passed to your `retrieve` function is a URI that has been resolved according to the base URI that you specified. Note that this URI is an identifier and not necessarily a network locator. In the case of a network-addressable URL, a schema need not be downloadable from its canonical URI.

## Acknowledgments

Many test cases have been ported from [@apidevtools/json-schema-ref-parser](https://apitools.dev/json-schema-ref-parser/).

## License

This project is [MIT](https://github.com/criteria-labs/criteria-api-tools/blob/main/packages/criteria-json-schema/LICENSE) licensed.

## About Criteria

[Criteria](https://criteria.sh) is a collaborative platform for designing APIs.

Two types of tooling

- WOrking with OpenAPI documents - serializing, bundling, importing exporting
- Working with OpenAPI data at runtime, request/response validation, codegen etc.

Foundational types to serve both use cases OpenAPI, DereferencedOpenAPI
DereferencedOpenAPI substitutes never for Reference, so you' don't need to to tahype narrowing in code
hooks, onDereference() -> stash serialization context

# @criteria/openapi

TypeScript type definitions and functions for the OpenAPI specification.

- TypeScript support, including type narrowing.
- Immutable values
- Sync or async
- Validation
- DereferencedOpenAPI distinct to OpenAPI

## Getting Started

```shell
npm install @criteria/openapi
```

## Usage

```typescript
import { OpenAPI } from '@criteria/openapi'
```

## Usage

- Validating objects conform to interface
  - Obtaining validators
  -
- ## Working with references
  - Dereferencing

### Accessing TypeScript types

```typescript
import { OpenAPI } from '@criteria/openapi'

const openAPI: OpenAPI = {
    ...
}
```

Narrow values to OpenAPI types using the isOpenAPI function.

```typescript
import { OpenAPI, isOpenAPI } from '@criteria/openapi'

const value: any = // ...

if (isOpenAPI(value)) {
  // value is OpenAPI
}
```

```typescript
import { OpenAPI, isOpenAPI, strictValidator } from '@criteria/openapi'

if (isOpenAPI(value, { validator: strictValidator })) {
  // value is OpenAPI
}
```

You can access specific versions of the specification.

```typescript
import { OpenAPI as OpenAPIv3_0, isOpenAPI as isOpenAPIv3_0 } from '@criteria/openapi/v3.0'
import { OpenAPI as OpenAPIv3_1, isOpenAPI as isOpenAPIv3_1 } from '@criteria/openapi/v3.1'
```

### Validating objects conform to the OpenAPI specification

```typescript
import { validateOpenAPI, ValidationError } from '@criteria/openapi'

const value: any = // ...

try {
    validateOpenAPI(value)
    const validOpenAPI = value as OpenAPI
    // value is OpenAPI
} catch (error: ValidationError) {

}

```

### Dereferencing OpenAPI objects

TypeScript type predicates

```typescript
import { OpenAPI, isOpenAPI } from '@criteria/openapi'

isOpenAPI(obj, { validate: false }) // default
isOpenAPI(obj, { validate: true }) // equivalent to isOpenAPI(obj, { validate: validateOpenAPI })
isOpenAPI(obj, { validate: (obj) => { ... } })

// Example
const obj: unknown = {... }
if (isOpenAPI(obj)) {
    // obj is OpenAPI
}
```

Validating

```typescript
import { OpenAPI, validateOpenAPI } from '@criteria/openapi'

const obj: unknown = {... }
if (validateOpenAPI(obj)) {
    // obj is OpenAPI
}

validateOpenAPI(obj, { strict: false }) // default
validateOpenAPI(obj, { strict: true, validateExtension: (field, value, object, pointer) })
```

Obtaining validators

```typescript
const strictValidator = openAPIValidator({ strict: true })
strictValidator(obj)
```

Type-safe dereferenced objects

```typescript
import { OpenAPI, DereferencedOpenAPI } from '@criteria/openapi'

const openAPI: OpenAPI = { ... }
const schema = openAPI.components.schema // Schema | Reference

const dereferencedOpenAPI: DereferencedOpenAPI = { ... }
const schema = dereferencedOpenAPI.components.schema // Schema
```

Dereferencing

```typescript
import { DereferencedOpenAPI, isDereferencedOpenAPI, validateDereferencedOpenAPI } from '@criteria/openapi'
```

```typescript
const dereferencedOpenAPI = dereferenceOpenAPI(openAPI)
const dereferencedOpenAPI = dereferenceOpenAPI(openAPI, { retrieve: (uri) => object })
```
