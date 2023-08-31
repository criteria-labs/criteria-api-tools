# JSON Schema Validation

Validate JSON instances using the JSON Schema specification.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Acknowledgments](#acknowledgments)
- [License](#license)
- [About Criteria](#about-criteria)

## Overview

This package provides TypeScript functions for validating JSON values using the JSON Schema specification.

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
import { JSONSchema } from '@criteria/json-schema/draft-2020-12'
import { validateJSON } from '@criteria/json-schema-validation'

const schema: JSONSchema = {
  type: 'object',
  title: 'person',
  required: ['name']
  properties: {
    name: {
      type: 'string'
    }
  },
}

validateJSON({ name: 'Joan' }, schema)
```

If the value is not valid, `validateJSON` will throw a `ValidationError`.

```ts
try {
  validateJSON({}, schema)
} catch (error) {
  console.log(error.message)
  // Value is missing 'name'
}
```

## Usage

### Reusing schemas

The `jsonValidator` function can be used to create a reusable validator function.

```ts
import { JSONSchema } from '@criteria/json-schema/draft-2020-12'
import { jsonValidator } from '@criteria/json-schema-validation'

const schema: JSONSchema = {
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

Schemas should be dereferenced beforehand before validating values or creating validator functions.

```ts
import { JSONSchema, dereferenceJSONSchema } from '@criteria/json-schema/draft-2020-12'
import { jsonValidator } from '@criteria/json-schema-validation'

const inputSchema: JSONSchema = {
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

const dereferencedSchema = dereferenceJSONSchema(inputSchema)

validateJSON({ name: 'Joan' }, dereferencedSchema)
```

## License

This project is [MIT](https://github.com/criteria-labs/criteria-api-tools/blob/main/packages/criteria-json-schema-validation/LICENSE) licensed.

## About Criteria

[Criteria](https://criteria.sh) is a collaborative platform for designing APIs.
