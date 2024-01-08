# JSON Schema Validation

Validate JSON instances using the JSON Schema specification.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Options](#options)
- [The Output object](#the-output-object)
- [Usage](#usage)
- [Acknowledgments](#acknowledgments)
- [License](#license)
- [About Criteria](#about-criteria)

## Overview

This package provides TypeScript functions for validating JSON values using the JSON Schema specification.

The following drafts are currently supported:

- [Draft 04](https://json-schema.org/specification-links.html#draft-4)
- [Draft 06](https://json-schema.org/specification-links.html#draft-6)
- [Draft 2020-12](https://json-schema.org/specification-links.html#2020-12)

## Getting Started

Install JSON Schema Validation using npm:

```sh
npm install @criteria/json-schema-validation
```

Let's define a simple JSON schema in code to get started:

```ts
import { validateJSON } from '@criteria/json-schema-validation'

const schema = {
  type: 'object',
  title: 'person',
  required: ['name'],
  properties: {
    name: {
      type: 'string'
    }
  }
}

validateJSON({ name: 'Joan' }, schema)
```

If the value is not valid, `validateJSON` will throw a `ValidationError`.

```ts
try {
  validateJSON({}, schema)
} catch (error) {
  console.log(error.message)
  // The value is missing 'name'
}
```

Alternatively, use the `isJSONValid` function to return a boolean value instead of throwing an error.

```ts
import { isJSONValid } from '@criteria/json-schema-validation'

if (isJSONValid({}, schema)) {
  // valid
} else {
  // invalid
}
```

## Usage

### Reusing validators

The `jsonValidator` and `jsonValidatorAsync` functions can be used to create a reusable validator function. This allows you to efficiently validate multiple values against the same schema.

```ts
import { jsonValidator } from '@criteria/json-schema-validation'

const schema = {
  type: 'object',
  title: 'person',
  required: ['name']
  properties: {
    name: {
      type: 'string'
    }
  },
}

const validator = jsonValidator(schema)

validator({ name: 'Joan' })
validator({ name: 'Jean' })
validator({ name: 'John' })
```

### Dereferencing schemas

References to remote schemas can be dereferenced by specifying the `retrieve` option.

```ts
import { jsonValidator } from '@criteria/json-schema-validation'

const schema = {
  type: 'object',
  title: 'person',
  properties: {
    name: {
      $ref: '#/definitions/requiredString'
    },
    children: {
      type: 'array',
      items: {
        $ref: '#'
      }
    },
    address: {
      $ref: 'https://example.com/schemas/address.json'
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

// will be called once with uri = 'https://example.com/schemas/address.json'
const retrieve = (uri: string): any => {
  return schemasByID[uri]
}
const validator = jsonValidator(schema, { retrieve })

validator({ name: 'Joan', address: { street: 'Example St' } })
```

#### Retrieving referenced schemas asynchronously

The `validateJSON`, `isJSONValid` and `jsonValidator` functions have asynchronous counterparts `validateJSONAsync`, `isJSONValidAsync` and `jsonValidatorAsync`.

These functions accept an asynchronous retrieve function.

```ts
// will be called once with uri = 'https://example.com/schemas/address.json'
const asyncRetrieve = async (uri: string): Promise<any> => {
  const response = await fetch(uri)
  return await response.json()
}
const validator = await jsonValidatorAsync(schema, { retrieve: asyncRetrieve })

validator({ name: 'Joan', address: { street: 'Example St' } })
```

### Querying validation failure details

You can query details about why validation failed using the Output object that is returned from the reusable validator function.

```ts
import { jsonValidator } from '@criteria/json-schema-validation'

const validator = jsonValidator(schema)

const output = validator({})

if (!output.valid) {
  for (const error of output.errors ?? []) {
    console.log(error.message)
    console.log(error.schemaLocation)
    console.log(error.instanceLocation)
  }
}
```

See [The Output object](#the-output-object) for available properties.

### Using particular drafts of JSON Schema

If the `$schema` keyword is present in a schema, that draft will be used.

```ts
const schema = {
  $schema: 'http://json-schema.org/draft-04/schema#'
  type: 'number'
  maximum: 100
  exclusiveMaximum: true
}

const validator = jsonValidator(schema)
```

Otherwise, the defaultMetaSchemaURI option will be used to specify the draft to use.

```ts
const schema = {
  type: 'number'
  maximum: 100
  exclusiveMaximum: true
}

const validator = jsonValidator(schema, { defaultMetaSchemaURI: 'http://json-schema.org/draft-04/schema#' })
```

| Draft         | Meta Schema URI                                |
| ------------- | ---------------------------------------------- |
| Draft 04      | 'http://json-schema.org/draft-04/schema#'      |
| Draft 06      | 'http://json-schema.org/draft-06/schema#'      |
| Draft 2020-12 | 'https://json-schema.org/draft/2020-12/schema' |

As an alternative to providing the `defaultMetaSchemaURI` option, you can import functions from the relevant draft-specific module.

```ts
import { validateJSON, isValidJSON, jsonValidator } from '@criteria/json-schema-validation/draft-2020-12'
```

```ts
import { validateJSON, isValidJSON, jsonValidator } from '@criteria/json-schema-validation/draft-06'
```

```ts
import { validateJSON, isValidJSON, jsonValidator } from '@criteria/json-schema-validation/draft-04'
```

## Options

All functions accept an optional object containing options as their final argument.

```ts
validateJSON(instance, schema, options)
```

```ts
isValidJSON(instance, schema, options)
```

```ts
jsonValidator(schema, options)
```

### `outputFormat`

`'flag' | 'verbose'`

Determines whether the `Output` object contains validation failure details.

The default value is `'flag'`.

### `failFast`

`boolean`

Whether to failure validation after encountering the first issue.

The default value is `false`.

### `assertFormat`

`boolean`

Whether to evaluate `format` keywords as assertions. When `true`, values that do not conform to the expected format will fail validation.

Note, this option only applies to Draft 2020-12. In earlier drafts the `format` keyword is always evaluated as assertions.

The default value is `false`.

### `baseURI`

`string`

The base URI to use when resolving URI references.

### `retrieve`

`(uri: string) => any`

A function used to dereference remote schemas.

If `retrieve` is called and returns a Promise then the return value `isJSONValid`, `validateJSON` and `jsonValidator` will also be a Promise. To ensure that these functions always return a Promise, regardless of whether `retrieve` is called or not, use the `isJSONValidAsync`, `validateJSONAsync` and `jsonValidatorAsync` functions instead.

### `defaultMetaSchemaURI`

`string`

Specifies the JSON Schema Specification draft to use when the meta schema of a schema cannot be determined.

The default value is `'https://json-schema.org/draft/2020-12/schema'`.

## The Output object

### `valid`

`boolean`

Whether or not the JSON value is valid.

### `schemaLocation`

`string`

A JSON Pointer describing the location of the schema that was used to produce this output.

For the top-level output this will be an empty string, indicating the root schema was used.

### `instanceLocation`

`string`

A JSON Pointer describing the location of the value within the JSON document that was validated to produce this output.

### `errors`

`Output[]`

An array of output objects describing the validation failure in further detail.

## License

This project is [MIT](https://github.com/criteria-labs/criteria-api-tools/blob/main/packages/criteria-json-schema-validation/LICENSE) licensed.

## About Criteria

[Criteria](https://criteria.sh) is a collaborative platform for designing APIs.
