export type FromTupleLiteral<T> = T extends [...infer U] | readonly [...infer U]
  ? U extends Primitive
    ? never
    : T[number] extends string
    ? T[number]
    : never
  : never

export type OptionalToPrimitive<T extends OptionalPrimitive> = T extends 'string?'
  ? string
  : T extends 'number?'
  ? number
  : T extends 'boolean?'
  ? boolean
  : never
export type OptionalPrimitive = 'string?' | 'number?' | 'boolean?'
export type Primitive = 'string' | 'number' | 'boolean'

export type Reference =
  | OptionalPrimitive
  | Primitive
  | readonly [Primitive]
  | [Primitive]
  | readonly [Validator]
  | [Validator]
  | Validator
  | [...string[]]
  | readonly [...string[]]

export type Validator = { [key: string]: Reference }

export type FromOptional<T extends OptionalPrimitive> = T extends 'string?'
  ? string | undefined
  : T extends 'boolean?'
  ? boolean | undefined
  : T extends 'number?'
  ? number | undefined
  : never

export type FromPrimitve<T extends Primitive> = T extends 'string'
  ? string
  : T extends 'boolean'
  ? boolean
  : T extends 'number'
  ? number
  : never

export type FromTuple<T> = T extends [infer U] | readonly [infer U]
  ? U extends Primitive
    ? Array<FromPrimitve<U>>
    : never
  : never

export type FromOptionalTuple<T> = T extends [infer U] | readonly [infer U]
  ? U extends OptionalPrimitive
    ? Array<OptionalToPrimitive<U>> | undefined
    : never
  : never

export type FromTupleBody<T> = T extends [infer U]
  ? U extends Validator
    ? Array<UnwrapBody<U>>
    : never
  : T extends readonly [infer U]
  ? U extends Validator
    ? Array<UnwrapBody<U>>
    : never
  : never

export type UnwrapBody<T extends { [key: string]: Reference }> = {
  -readonly [key in keyof T]: T[key] extends Primitive
    ? FromPrimitve<T[key]>
    : T[key] extends OptionalPrimitive
    ? FromOptional<T[key]>
    : T[key] extends [Primitive] | readonly [Primitive]
    ? FromTuple<T[key]>
    : T[key] extends [OptionalPrimitive] | readonly [OptionalPrimitive]
    ? FromOptionalTuple<T[key]>
    : T[key] extends [Validator] | readonly [Validator]
    ? FromTupleBody<T[key]>
    : T[key] extends Validator
    ? UnwrapBody<T[key]>
    : FromTupleLiteral<T[key]>
}
