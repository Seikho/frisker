import { expect } from 'chai'
import { isValid, isValidPartial, validateBody, Validator } from '.'

const simple = {
  astring: 'string',
  anumber: 'number',
  aboolean: 'boolean',
} as const

const complex = {
  id: 'string',
  name: 'string',
  location: {
    country: 'string',
    state: 'string',
  },
} as const

const arrays = {
  strings: ['string'],
  booleans: ['boolean'],
  numbers: ['number'],
  objects: [simple],
} as const

type Test = {
  it: string
  using: Validator
  input: any
  expect?: boolean // Defaults to true
  partial?: boolean // Defaults to false
}

const tests: Test[] = [
  {
    it: 'validate a simple object with each primitive',
    using: simple,
    input: { astring: 'a', anumber: 42, aboolean: true },
    expect: true,
  },
  {
    ...tosimple('invalidate number as string'),
    input: { astring: 42 },
    expect: false,
  },
  {
    ...tosimple('invalidate string of "true" as boolean'),
    input: { aboolean: 'true' },
    expect: false,
  },
  {
    it: 'validate a nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au', state: 'nsw' } },
    expect: true,
  },
  {
    it: 'invalidate missing property on nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au' } },
    expect: false,
  },
  {
    it: 'partially validate missing property on nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au' } },
    partial: true,
  },
  {
    ...toarray('validate array types'),
    input: {
      booleans: [true, false],
      strings: ['a', 'b', 'c'],
      numbers: [1, 2, 3],
      objects: [
        { astring: 'a', anumber: 1, aboolean: true },
        { astring: 'b', anumber: 2, aboolean: false },
      ],
    },
    partial: false,
  },
  {
    ...toarray('invalidate string array containing numbers'),
    input: { strings: ['a', 'b', 1] },
    expect: false,
  },
  {
    ...toarray('invalidate string array containing booleans'),
    input: { strings: ['a', 'b', false] },
    expect: false,
  },
  {
    ...toarray('invalidate number array containing strings'),
    input: { numbers: [1, 2, 3, '4'] },
    expect: false,
  },
  {
    ...toarray('invalidate number array containing booleans'),
    input: { numbers: [1, 2, 3, false] },
    expect: false,
  },
  {
    ...toarray('invalidate boolean array containing strings'),
    input: { booleans: [true, false, '4'] },
    expect: false,
  },
  {
    ...toarray('invalidate object array containing strings'),
    input: { objects: [{ astring: 'a', anumber: 1, aboolean: true }, 'foo'] },
    expect: false,
  },
]

describe('validation tests', () => {
  let count = 0
  for (const test of tests) {
    count++
    it(`#${count}. will ${test.it}`, () => {
      const actual = test.partial
        ? isValidPartial(test.using, test.input)
        : isValid(test.using, test.input)
      let msg = ''
      if (actual !== test.expect) {
        msg = validateBody(test.using, test.input, { notThrow: true, partial: test.partial }).join(
          ', '
        )
      }
      expect(actual, msg).to.equal(test.expect ?? true)
    })
  }
})

function tosimple(msg: string) {
  return {
    it: msg,
    using: simple,
    partial: true,
  }
}

function toarray(msg: string) {
  return {
    it: msg,
    using: arrays,
    partial: true,
  }
}
