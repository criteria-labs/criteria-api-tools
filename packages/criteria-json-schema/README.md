# JSON Schema

TypeScript type definitions and functions for the [JSON Schema](https://json-schema.org/) specification.

The following drafts are currently supported:

- [Draft 04](https://json-schema.org/specification-links.html#draft-4)
- [Draft 2020-12](https://json-schema.org/specification-links.html#2020-12)

## Overview

This package provides TypeScript type definitions for working with JSON Schema documents. It is intended to be used by tooling authors, to build JSON Schema tools in TypeScript across various drafts of the specification easily.

For example, between Draft 04 and Draft 2020-12 the `exclusiveMinimum` and `exclusiveMaximum` keywords changed from a boolean to a number to be consistent with the principle of keyword independence. Mixing these up is caught by the TypeScript compiler:

```ts
import { JSONSchemaDraft2020_12 } from '@criteria/json-schema'

const schema: JSONSchemaDraft2020_12 = {
  type: 'number',
  maximum: 100,
  exclusiveMaximum: true
}
// Type 'boolean' is not assignable to type 'number'.
```

## Installation

```sh
npm install @criteria/json-schema
```

## Usage

### Importing types

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
