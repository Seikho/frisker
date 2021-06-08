# frisker

> Quick and declarative object validation with TypeScript with simple objects

## Why?

When building APIs I will need to validate the `request.body` or `request.query` object to ensure it conforms to a type.  
I have done this in the past with varying amount of rigor, robustness, and verbosity.

I wanted a clear, yet terse way to solve this problem that was still robust and not overly repetitive.

## Requirements

TypeScript 4+

## Installation

```sh
> yarn add frisker
```

## Usage

Frisker can check for a complete or partial match of an object to a validator object.  
Validator objects are real objects declared using the `as const` syntax that closely resembles a TypeScript type or interface.  
The objects can be deeply nested and composed together using the object spread syntax.

Objects are comprised the values:

- Primitives
  - `'string'`
  - `'number'`
  - `'boolean'`
- Optional Primitives
  - `'string?'`
  - `'number?'`
  - `'boolean?'`
- A single element tuple with a primitive or an object which represents an array
  - `[Primitive] | [Object]`
- An optional array of primitives
  - `[OptionalPrimitive]`
  - I.e. `['string?'] | ['number?'] | ['boolean?']`
- Objects containing all of the previous types of values
- `{ [key: string]: Primtive | [Primitive] | [Object] | Object }`
- A tuple of string literals represents a string literal
  - `[...string[]]`
  - E.g. `['user', 'guest', 'admin']`

This is a fairly shallow example using all of the available "types"

```ts
export const user = {
  id: 'string',
  name: { first: 'string', last: 'string', alias: 'string' },
  union: ['admin', 'user', 'guest'],
  age: 'number',
  isAdmin: 'boolean',
  permissions: ['string'],
  groups: [{ id: 'string', name: 'string' }],
  alias: 'string?', // Optional string
  previousAliases: ['string?'], // Optional array
} as const

export type User = UnwrapBody<typeof user>
```

### Type Guard

```ts
function isValid(type: Validator, input: any)
```

Frisker can be used as a **Type Guard**:

```ts
// Example using an express handler:
import { Request, Response } from 'express'
import { isValid } from 'frisker'
import { user } from './types'

export function ({ body }: Request, res: Response) {
  if (!isValid(user, body)) {
    return res.status(400).json({ message: 'Bad request' })
  }

  // body is now a User type which is inferred from the first parameter is isValid()
  if (!body.permissions.includes('users')) {
    return res.status(403).json({ message: 'Not allowed' })
  }

  return res.json({ message: 'ok' })
}
```

### Type Assertion

```ts
function assertValid(type: Validator, input: any, partial?: boolean)
```

The `assertValid` function will throw if the input does not conform to the validator.  
When combined with an error handling middleware, the assertion helper can reduce boilerplate as seen in earlier examples:

```ts
import { RequestHandler } from 'express'
import { assertValid } from 'frisker'

/**
 * A helper for passing errors to the error middleware
 */
function wrap(handler: RequestHandler) {
  const wrapped: RequestHandler = async (req, res, next) => {
    try { await handler(req, res, next) }
    catch (ex) { next(ex) }
  }

  return wrapped
}

const body = { username: 'string', password: 'string' } as const

export const register = wrap((req, res) => {
  assertValid(body, req.body)

  // The req.body object will now be the type you expect and be safe to use
  await createAccount(req.body.username, req.body.password)
  res.json({ true })
})
```

### Partial Type Guard

```ts
function isValidPartial(type: Validator, input: any)
```

```ts
import { isValidPartial } from 'frisker'
import { user } from './types' // From the previous example

export function handler({ body, params }: Request, res: Response) {
  if (!isValidPartial(user.name, body)) {
    return res.status(400).json({ message: 'Bad request' })
  }

  await updateName(params.id, body)
  res.json({ message: 'ok' })
}
```

### Configurable Validation

```ts
function validateBody(type: Validator, input: any, options: Options)
```

Using the `validateBody()` function you can get more detail information about the validation

**Options**

- `notThrow: boolean`: Defaults to `false`
  - the `validateBody` function throws by default with a message containing all of the errors
  - Provide `true` if you want an array of the errors
- `partial: boolean`
  - Will only validate properties provided in the object provided for comparison
