# JSON Schema

TypeScript type definitions and functions for the [JSON Schema](https://json-schema.org/) specification.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Importing type definitions](#importing-type-definitions)
  - [Retrieving external documents](#retrieving-external-documents)
  - [Definining additional vocabularies](#definining-additional-vocabularies)
- [Acknowledgments](#acknowledgments)
- [License](#license)

## Overview

This package provides TypeScript type definitions and functions for working with JSON Schema documents. It is intended to be used by tooling authors, to build JSON Schema tools in TypeScript across various drafts of the specification easily.

This package also contains functions to dereference JSON Schema documents into plain JavaScript objects according to the reference resolution rules of the specification.

The following drafts are currently supported:

- [Draft 04](https://json-schema.org/specification-links.html#draft-4)
- [Draft 2020-12](https://json-schema.org/specification-links.html#2020-12)

## Getting Started

Install JSON Schema using npm:

```sh
npm install @criteria/json-schema
```

Let's define a simple JSON schema in code to get started:

```ts
import { JSONSchema } from '@criteria/json-schema/draft-04'

const schema: JSONSchema = {
  type: 'object',
  title: 'person',
  properties: {
    name: {
      $ref: '#/definitions/requiredString'
    },
    email: {
      $ref: '#/definitions/requiredString'
    }
  },
  definitions: {
    requiredString: {
      title: 'requiredString',
      type: 'string',
      minLength: 1
    }
  }
}
```

Right now if we tried to inspect the type of the name or email properties we would get undefined:

```ts
console.log(schema.properties.name.type)
// undefined
```

We can use the `dereferenceJSONSchema()` function to transform our schema object with `$ref` values into plain JavaScript objects without any references:

```ts
import { JSONSchema, DereferencedJSONSchema, dereferenceJSONSchema } from '@criteria/json-schema/draft-04'

const schema: JSONSchema = {
  type: 'object',
  title: 'person',
  properties: {
    name: {
      $ref: '#/definitions/requiredString'
    },
    email: {
      $ref: '#/definitions/requiredString'
    }
  },
  definitions: {
    requiredString: {
      title: 'requiredString',
      type: 'string',
      minLength: 1
    }
  }
}

const dereferencedSchema: DereferencedJSONSchema = dereferenceJSONSchema(schema)

console.log(dereferencedSchema.properties.name.type)
// string

console.log(dereferencedSchema.properties.name.minLength)
// 1
```

Notice how the return type is `DereferencedJSONSchema` instead of `JSONSchema`. This is a TypeScript type alias that omits all `$ref` keys.

## Installation

```sh
npm install @criteria/json-schema
```

## Usage

### Importing type definitions

Type names are suffixed with the draft that they correspond to:

```ts
import { JSONSchemaDraft04, JSONSchemaDraft2020_12 } from '@criteria/json-schema'

const fooSchema: JSONSchemaDraft04 = {
  $schema: 'http://json-schema.org/draft-04/schema#'
}

const barSchema: JSONSchemaDraft2020_12 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema'
}
```

If you only want to import types for a specific draft, you can import more concise types from the draft-specific module:

```ts
import { JSONSchema } from '@criteria/json-schema/draft-04'

const schema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#'
}
```

```ts
import { JSONSchema } from '@criteria/json-schema/draft-2020-12'

const schema: JSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema'
}
```

The `exclusiveMinimum` and `exclusiveMaximum` keywords are an example of type differences between Draft 04 and Draft 2020-12. In Draft 04 they were boolean values, whereas in Draft 2020-12 they are now numbers to be consistent with the principle of keyword independence. Mixing these up is caught by the TypeScript compiler:

```ts
import { JSONSchemaDraft2020_12 } from '@criteria/json-schema'

const schema: JSONSchemaDraft2020_12 = {
  type: 'number',
  maximum: 100,
  exclusiveMaximum: true
}
// Type 'boolean' is not assignable to type 'number'.
```

### Retrieving external documents

It's common for schema authors to organize complex schemas as multiple shared files. You can provide a custom retrieve function to `dereferenceJSONSchema()` in order to perform an filesystem or network operations.

The following example dereferences a JSON schema that references other files within a `shared-schemas` directory.

```ts
import { readFileSync } from 'fs'

const baseURI = resolve(__dirname, 'shared-schemas/root.json')

const retrieve = (uri: string) => {
  const data = readFileSync(uri, { encoding: 'utf8' })
  return JSON.parse(data)
}

const dereferencedSchema = dereferenceJSONSchema(rootSchema, { baseURI, retrieve })
```

The argument passed to your `retrieve` function is a URI that has been resolved according to the specification rules. It is not necessarly

### Definining additional vocabularies

> Note: This is only supported in Draft 2020-12.

Schema authors can require additional vocabularies not defined by the Core/Validation Dialect meta-schema in order to process the schema.

Tooling can extend the base `JSONSchema` type to provide type safety for additional vocabularies:

```ts
import { JSONSchema } from '@criteria/json-schema'

interface MyValidationKeywords {
  foo: boolean
}

type MyJSONSchema = JSONSchema<MyValidationKeywords>

const schema: MyJSONSchema = {}
// Property 'foo' is missing...
```

Passing the type to `JSONSchema`'s generic argument ensures that the additional vocabulary is also applied to all subschemas.

## Acknowledgments

Many test cases have been ported from [@apidevtools/json-schema-ref-parser](https://apitools.dev/json-schema-ref-parser/).

## License

This project is [MIT](https://github.com/criteria-labs/criteria-api-tools/blob/main/packages/criteria-json-schema/LICENSE) licensed.
