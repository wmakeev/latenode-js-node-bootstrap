// @ts-check

import { test, suite } from 'node:test'
import { getRun } from '../src/index.js'
// import assert from 'node:assert/strict'

/** @import { TestContext } from 'node:test' */

/**
 * @param { Nodul.CustomParamsConfig } config
 * @param { Record<string, unknown> } data
 * @returns { Nodul.RunParams }
 */
const createRunParams = (config, data) => {
	return {
		store: {
			setVariable: () => {}
		},
		data: {
			code: `/** @CustomParams ${JSON.stringify(config)} */`,
			use_bun: false,
			...data
		}
	}
}

suite('getRun', () => {
	test('simple', async t => {
		/** @type { any } */
		const params = { code: 'var a = 43;', data: {} }

		t.plan(4)

		const run = getRun(async (params1, params2) => {
			t.assert.equal(params1, params)

			t.assert.deepEqual(params2.params, {})
			t.assert.equal(params2.customParamsConfig, null)

			return { ok: true }
		})

		const result = await run(params)

		t.assert.deepEqual(result, { result: { ok: true }, error: null })
	})

	test('resultSelector', async t => {
		const params = createRunParams(
			{
				resultSelector: {
					type: 'string',
					title: 'resultSelector'
				}
			},
			{
				resultSelector: 'foo.bar'
			}
		)

		const run = getRun(async () => {
			return { foo: { bar: 42 } }
		})

		const result = await run(params)

		t.assert.deepEqual(result, { result: 42, error: null })
	})

	test('resultVariable', async t => {
		const params = createRunParams(
			{
				resultVariable: {
					type: 'string',
					title: 'resultVariable'
				}
			},
			{
				resultVariable: 'my_var'
			}
		)

		const setVariable = t.mock.method(params.store, 'setVariable').mock

		const run = getRun(async () => {
			return { foo: { bar: 42 } }
		})

		await run(params)

		t.assert.deepEqual(setVariable.callCount(), 1)

		const args = setVariable.calls[0]?.arguments
		t.assert.equal(args?.[0], 'my_var')
		t.assert.deepEqual(args?.[1], { foo: { bar: 42 } })
	})

	test('errorVariable', async (/** @type { TestContext } */ t) => {
		t.plan(8)

		const params = createRunParams(
			{
				errorVariable: {
					type: 'string',
					title: 'errorVariable'
				}
			},
			{
				errorVariable: 'error'
			}
		)

		const setVariable = t.mock.method(params.store, 'setVariable').mock

		const run = getRun(async () => {
			const err = new Error('Test error!')
			// @ts-expect-error test
			err.code = 'ERR_CODE'
			throw err
		})

		try {
			await run(params)
		} catch (/** @type { any } */ err) {
			t.assert.equal(err.message, 'Test error!')
		}

		t.assert.deepEqual(setVariable.callCount(), 1)

		const args = setVariable.calls[0]?.arguments
		t.assert.equal(args?.[0], 'error')

		/** @type { any } */
		const errVar = args?.[1]
		t.assert.ok(errVar)
		t.assert.equal(errVar.code, 'ERR_CODE')
		t.assert.equal(errVar.message, 'Test error!')
		t.assert.equal(errVar.name, 'Error')
		t.assert.ok(errVar.stack.startsWith('Error: Test error!'))
	})

	test('errorVariable with catch error', async (/** @type { TestContext } */ t) => {
		const params = createRunParams(
			{
				errorVariable: {
					type: 'string',
					title: 'errorVariable'
				},
				shouldHandleError: {
					type: 'bool',
					title: 'shouldHandleError'
				}
			},
			{
				errorVariable: 'error',
				shouldHandleError: true
			}
		)

		const setVariable = t.mock.method(params.store, 'setVariable').mock

		const run = getRun(async () => {
			const err = new Error('Test error!')
			// @ts-expect-error test
			err.code = 'ERR_CODE'
			throw err
		})

		const result = await run(params)

		t.assert.equal(result?.result, null)
		t.assert.ok(result?.error)
		t.assert.ok(result?.error?.message, 'Test error!')

		t.assert.deepEqual(setVariable.callCount(), 1)

		const args = setVariable.calls[0]?.arguments
		t.assert.equal(args?.[0], 'error')

		/** @type { any } */
		const errVar = args?.[1]
		t.assert.ok(errVar)
		t.assert.equal(errVar.code, 'ERR_CODE')
		t.assert.equal(errVar.message, 'Test error!')
		t.assert.equal(errVar.name, 'Error')
		t.assert.ok(errVar.stack.startsWith('Error: Test error!'))
	})
})

suite('CustomParams', () => {
	suite('connection', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(3)

			const runParams = createRunParams(
				{
					connectionParam1: {
						type: 'connection',
						title: 'Connection parameter 1',
						required: false,
						description: 'Enter connection 1'
					},

					connectionParam2: {
						type: 'connection',
						title: 'Connection parameter 2',
						required: false,
						description: 'Enter connection 2'
					},

					connectionParam3: {
						type: 'connection',
						title: 'Connection parameter 3',
						required: true,
						description: 'Enter connection 3'
					}
				},
				{
					connectionParam1: '',
					connectionParam2: '{"access_token":"token"}',
					connectionParam3: 'token'
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.equal(params['connectionParam1'], undefined)
				t.assert.deepEqual(params['connectionParam2'], {
					access_token: 'token'
				})
				t.assert.equal(params['connectionParam3'], 'token')
			})

			await run(runParams)
		})

		test('required is empty', async (/** @type { TestContext } */ t) => {
			t.plan(1)

			const runParams = createRunParams(
				{
					connectionParam: {
						type: 'connection',
						title: 'Connection parameter',
						required: true,
						description: 'Enter connection'
					}
				},
				{
					connectionParam: ''
				}
			)

			getRun(async () => {
				t.assert.fail('should fail')
			})(runParams).catch(err => t.assert.ok(err))
		})
	})

	test('Unknown embedded type', async (/** @type { TestContext } */ t) => {
		t.plan(1)

		const runParams = createRunParams(
			{
				param1: {
					// @ts-expect-error test unknown type
					type: 'unknown',
					title: 'parameter 1'
				}
			},
			{
				param1: 'some'
			}
		)

		const run = getRun(async (_, { params }) => {
			t.assert.equal(params['param1'], 'some')
		})

		await run(runParams)
	})

	suite('string', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(2)

			const runParams = createRunParams(
				{
					stringParam1: {
						type: 'string',
						title: 'string parameter 1',
						required: false,
						description: 'Enter string 1'
					},

					stringParam2: {
						type: 'string',
						title: 'string parameter 2',
						required: true,
						description: 'Enter string 2'
					}
				},
				{
					stringParam1: '',
					stringParam2: 'text'
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.equal(params['stringParam1'], undefined)
				t.assert.equal(params['stringParam2'], 'text')
			})

			await run(runParams)
		})

		suite('custom types', () => {
			test('JSON', async (/** @type { TestContext } */ t) => {
				t.plan(4)

				const runParams = createRunParams(
					{
						jsonParam1: {
							type: 'string',
							title: 'json string parameter 1',
							required: false,
							description: '**JSON** Enter JSON string'
						},
						jsonParam2: {
							type: 'string',
							title: 'json string parameter 2',
							required: false,
							description: '**json** Enter JSON string'
						},
						jsonParam3: {
							type: 'string',
							title: 'json string parameter 3',
							required: false,
							description: '**JSON** Enter JSON string'
						},
						jsonParam4: {
							type: 'bool',
							title: 'json bool parameter 4',
							required: false,
							description: '**JSON** Enter JSON bool'
						}
					},
					{
						jsonParam1: '{ "foo": 42, "bar": "baz" }',
						jsonParam2: '',
						jsonParam3: 'null',
						jsonParam4: true
					}
				)

				const run = getRun(async (_, { params }) => {
					t.assert.deepEqual(params['jsonParam1'], { foo: 42, bar: 'baz' })
					t.assert.deepEqual(params['jsonParam2'], undefined)
					t.assert.deepEqual(params['jsonParam3'], null)
					t.assert.deepEqual(params['jsonParam4'], true)
				})

				await run(runParams)
			})

			test('Date', async (/** @type { TestContext } */ t) => {
				t.plan(6)

				const runParams = createRunParams(
					{
						dateParam1: {
							type: 'string',
							title: 'date string parameter 1',
							required: false,
							description: '**Date** Enter date string'
						},
						dateParam2: {
							type: 'string',
							title: 'date string parameter 2',
							required: false,
							description: '**date** Enter date string'
						},
						dateParam3: {
							type: 'string',
							title: 'date string parameter 3',
							required: false,
							description: '**date** Enter date string'
						},
						dateParam4: {
							type: 'int',
							title: 'date int parameter 4',
							required: false,
							description: '**DATE**: Enter date number'
						}
					},
					{
						dateParam1: '2025-11-02T09:34:26.234Z',
						dateParam2: '',
						dateParam3: 'null',
						dateParam4: 1762510237098
					}
				)

				const run = getRun(async (_, { params }) => {
					const param1 = params['dateParam1']
					t.assert.ok(param1 instanceof Date)
					t.assert.equal(param1.toJSON(), '2025-11-02T09:34:26.234Z')

					t.assert.deepEqual(params['dateParam2'], undefined)
					t.assert.deepEqual(params['dateParam3'], null)

					const param4 = params['dateParam4']
					t.assert.ok(param4 instanceof Date)
					t.assert.equal(param4.getTime(), 1762510237098)
				})

				await run(runParams)
			})

			test('Unknown custom type', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						dateParam1: {
							type: 'string',
							title: 'string parameter 1',
							required: false,
							description: '**UnknownType**: Enter string'
						}
					},
					{
						dateParam1: 'text'
					}
				)

				const run = getRun(async (_, { params }) => {
					t.assert.equal(params['dateParam1'], 'text')
				})

				await run(runParams)
			})

			test('Invalid Date', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						dateParam1: {
							type: 'string',
							title: 'date string parameter 1',
							required: false,
							description: '**Date** Enter date string'
						}
					},
					{
						dateParam1: 'invalid date'
					}
				)

				const run = getRun(async () => {})

				try {
					await run(runParams)
				} catch (/** @type { any } */ err) {
					t.assert.ok(err.message.includes('Invalid Date'))
				}
			})

			test('required custom type is empty', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						stringParam: {
							type: 'string',
							title: 'json string parameter',
							required: true,
							description: '**JSON**: Enter json string'
						}
					},
					{
						stringParam: ''
					}
				)

				getRun(async () => {
					t.assert.fail('should fail')
				})(runParams).catch(err => t.assert.ok(err))
			})
		})
	})

	suite('int', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(3)

			const runParams = createRunParams(
				{
					intParam1: {
						type: 'int',
						title: 'int parameter 1',
						required: false,
						description: 'Enter int 1'
					},

					intParam2: {
						type: 'int',
						title: 'int parameter 2',
						required: true,
						description: 'Enter int 2'
					},

					intParam3: {
						type: 'int',
						title: 'int parameter 3',
						required: false,
						description: 'Enter int 3'
					}
				},
				{
					intParam1: 0,
					intParam2: 0,
					intParam3: 123
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.equal(params['intParam1'], undefined)
				t.assert.equal(params['intParam2'], 0)
				t.assert.equal(params['intParam3'], 123)
			})

			await run(runParams)
		})
	})

	suite('bool', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(3)

			const runParams = createRunParams(
				{
					boolParam1: {
						type: 'bool',
						title: 'bool parameter 1',
						required: false,
						description: 'Enter bool 1'
					},

					boolParam2: {
						type: 'bool',
						title: 'bool parameter 2',
						required: true,
						description: 'Enter bool 2'
					},

					boolParam3: {
						type: 'bool',
						title: 'bool parameter 3',
						required: false,
						description: 'Enter bool 3'
					}
				},
				{
					boolParam1: false,
					boolParam2: false,
					boolParam3: true
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.equal(params['boolParam1'], undefined)
				t.assert.equal(params['boolParam2'], false)
				t.assert.equal(params['boolParam3'], true)
			})

			await run(runParams)
		})
	})

	suite('string_array', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(2)

			const runParams = createRunParams(
				{
					strArrParam1: {
						type: 'string_array',
						title: 'string_array parameter 1',
						required: false,
						description: 'Enter string array 1'
					},

					strArrParam2: {
						type: 'string_array',
						title: 'string_array parameter 2',
						required: true,
						description: 'Enter string array 2'
					}
				},
				{
					strArrParam1: [],
					strArrParam2: ['1', '2', '3']
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.deepEqual(params['strArrParam1'], [])
				t.assert.deepEqual(params['strArrParam2'], ['1', '2', '3'])
			})

			await run(runParams)
		})

		suite('custom types', () => {
			test('JSON', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						strArrParam1: {
							type: 'string_array',
							title: 'json string array parameter 1',
							required: false,
							description: '**JSON** Enter JSON array string'
						}
					},
					{
						strArrParam1: [
							'{ "foo": 42, "bar": "baz" }',
							'1',
							'null',
							'"str"',
							'',
							'true'
						]
					}
				)

				const run = getRun(async (_, { params }) => {
					t.assert.deepEqual(params['strArrParam1'], [
						{ foo: 42, bar: 'baz' },
						1,
						null,
						'str',
						undefined,
						true
					])
				})

				await run(runParams)
			})

			test('Incorrect JSON item', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						strArrParam1: {
							type: 'string_array',
							title: 'json string array parameter 1',
							required: false,
							description: '**JSON** Enter JSON array string'
						}
					},
					{
						strArrParam1: [
							'{ "foo": 42, "bar": "baz" }',
							'incorrect json string',
							'42'
						]
					}
				)

				const run = getRun(async () => {})

				try {
					await run(runParams)
				} catch (/** @type {any} */ err) {
					t.assert.equal(
						err.message,
						`Can't parse "json string array parameter 1" parameter item at index 1 as "json" type: Unexpected token 'i', "incorrect "... is not valid JSON`
					)
				}
			})

			test('Date', async (/** @type { TestContext } */ t) => {
				t.plan(3)

				const runParams = createRunParams(
					{
						strArrParam1: {
							type: 'string_array',
							title: 'date string array parameter 1',
							required: false,
							description: '**Date** Enter Date array string'
						}
					},
					{
						strArrParam1: ['2025-11-02T09:34:26.234Z', '']
					}
				)

				const run = getRun(async (_, { params }) => {
					const strArrParam1 = params['strArrParam1']

					t.assert.ok(Array.isArray(strArrParam1))
					t.assert.ok(strArrParam1[0] instanceof Date)
					t.assert.equal(strArrParam1[1], undefined)
				})

				await run(runParams)
			})
		})
	})

	suite('string_to_string', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(2)

			const runParams = createRunParams(
				{
					param1: {
						type: 'string_to_string',
						title: 'parameter 1',
						required: false,
						description: 'Enter parameter 1'
					},

					param2: {
						type: 'string_to_string',
						title: 'parameter 2',
						required: true,
						description: 'Enter parameter 2'
					}
				},
				{
					param1: {},
					param2: { foo: 'bar' }
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.deepEqual(params['param1'], {})
				t.assert.deepEqual(params['param2'], { foo: 'bar' })
			})

			await run(runParams)
		})

		suite('custom types', () => {
			test('JSON', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						param1: {
							type: 'string_to_string',
							title: 'parameter 1',
							required: false,
							description: '**JSON** Enter JSON string values'
						}
					},
					{
						param1: {
							foo: '{ "a": 42 }',
							bar: 14,
							baz: ''
						}
					}
				)

				const run = getRun(async (_, { params }) => {
					t.assert.deepEqual(params['param1'], {
						foo: { a: 42 },
						bar: 14,
						baz: undefined
					})
				})

				await run(runParams)
			})

			test('incorrect JSON value', async (/** @type { TestContext } */ t) => {
				t.plan(1)

				const runParams = createRunParams(
					{
						param1: {
							type: 'string_to_string',
							title: 'parameter 1',
							required: false,
							description: '**JSON** Enter JSON string values'
						}
					},
					{
						param1: {
							foo: '{ "a": 42 }',
							bar: 'incorrect json string',
							baz: ''
						}
					}
				)

				const run = getRun(async () => {})

				try {
					await run(runParams)
				} catch (/** @type { any } */ err) {
					t.assert.equal(
						err.message,
						`Can't parse "parameter 1" parameter value at key "bar" as "json" type: Unexpected token 'i', "incorrect "... is not valid JSON`
					)
				}
			})

			test('Date', async (/** @type { TestContext } */ t) => {
				t.plan(3)

				const runParams = createRunParams(
					{
						param1: {
							type: 'string_to_string',
							title: 'parameter 1',
							required: false,
							description: '**Date** Enter Date string value'
						}
					},
					{
						param1: {
							foo: '2025-11-02T09:34:26.234Z',
							bar: ''
						}
					}
				)

				const run = getRun(async (_, { params }) => {
					/** @type { any } */
					const param1 = params['param1']

					t.assert.ok(typeof param1 === 'object')
					t.assert.ok(param1.foo instanceof Date)
					t.assert.equal(param1.bar, undefined)
				})

				await run(runParams)
			})
		})
	})

	suite('select', () => {
		test('basic', async (/** @type { TestContext } */ t) => {
			t.plan(4)

			const runParams = createRunParams(
				{
					param1: {
						type: 'select',
						title: 'Select parameter',
						required: false,
						description: 'Enter parameter',
						options: {
							options: [
								{ key: 'SelectOptionKey1', value: 'SelectOptionValue1' },
								{ key: 'SelectOptionKey2', value: 'SelectOptionValue2' }
							],
							multiple: false
						}
					},

					param2: {
						type: 'select',
						title: 'Multi-select parameter',
						required: false,
						description: 'Enter parameter',
						options: {
							options: [
								{
									key: 'MultiSelectOptionKey1',
									value: 'MultiSelectOptionValue1'
								},
								{
									key: 'MultiSelectOptionKey2',
									value: 'MultiSelectOptionValue2'
								}
							],
							multiple: true
						}
					},

					param3: {
						type: 'select',
						title: 'Select parameter',
						required: true,
						description: 'Enter parameter',
						options: {
							options: [
								{ key: 'SelectOptionKey1', value: 'SelectOptionValue1' },
								{ key: 'SelectOptionKey2', value: 'SelectOptionValue2' }
							],
							multiple: false
						}
					},

					param4: {
						type: 'select',
						title: 'Multi-select parameter',
						required: true,
						description: 'Enter parameter',
						options: {
							options: [
								{
									key: 'MultiSelectOptionKey1',
									value: 'MultiSelectOptionValue1'
								},
								{
									key: 'MultiSelectOptionKey2',
									value: 'MultiSelectOptionValue2'
								}
							],
							multiple: true
						}
					}
				},
				{
					param1: null,
					param2: null,
					param3: ['SelectOptionKey1'],
					param4: ['MultiSelectOptionKey1', 'MultiSelectOptionKey2']
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.deepEqual(params['param1'], null)
				t.assert.deepEqual(params['param2'], null)
				t.assert.equal(params['param3'], 'SelectOptionKey1')
				t.assert.deepEqual(params['param4'], [
					'MultiSelectOptionKey1',
					'MultiSelectOptionKey2'
				])
			})

			await run(runParams)
		})
	})

	suite('object construct', () => {
		test('case', async (/** @type { TestContext } */ t) => {
			t.plan(1)

			const runParams = createRunParams(
				{
					'sample.str': {
						type: 'string',
						title: '(Sample) sample.str',
						required: false,
						description: 'Enter string',
						options: {
							minLength: 0
						}
					},

					'sample.bool': {
						type: 'bool',
						title: '(Sample) sample.bool',
						required: false,
						description: 'Enter parameter'
					},

					'sample.date': {
						type: 'string',
						title: '(Sample) sample.date',
						required: false,
						description: '**Date** parameter'
					},

					'sample.super.deep.obj': {
						type: 'string',
						title: '(Sample) sample.super.deep.obj',
						required: false,
						description: '**JSON**: Enter JSON parameter'
					},

					'sample.super.nothing': {
						type: 'string',
						title: '(Sample) sample.super.nothing',
						required: false,
						description: ''
					},

					'sample.super.nullish': {
						type: 'string',
						title: '(Sample) sample.super.nullish',
						required: false,
						description: ''
					}
				},
				{
					'sample.str': 'text',
					'sample.bool': true,
					'sample.date': '2025-11-10T10:15:00Z',
					'sample.super.deep.obj': '{ "foo": 42 }',
					'sample.super.nothing': '',
					'sample.super.nullish': 'null'
				}
			)

			const run = getRun(async (_, { params }) => {
				t.assert.deepEqual(params['sample'], {
					str: 'text',
					bool: true,
					date: new Date('2025-11-10T10:15:00Z'),
					super: {
						deep: {
							obj: { foo: 42 }
						},
						nullish: null
					}
				})
			})

			await run(runParams)
		})
	})

	test('user custom parameter parser', async (/** @type { TestContext } */ t) => {
		t.plan(7)

		const runParams = createRunParams(
			{
				param1: {
					type: 'string',
					title: 'parameter 1',
					description: '**MyDate**: my own date type'
				}
			},
			{
				param1: '2025.10.11'
			}
		)

		const run = getRun(
			async (_, { params }) => {
				const param1 = params['param1']

				t.assert.ok(param1 instanceof Date)
				t.assert.equal(param1.getFullYear(), 2025)
				t.assert.equal(param1.getMonth(), 9)
				t.assert.equal(param1.getDate(), 11)
			},
			{
				customParamTypeParsers: {
					mydate: (value, paramConfig) => {
						t.assert.ok(typeof value === 'string')
						t.assert.equal(value, '2025.10.11')
						t.assert.equal(paramConfig.title, 'parameter 1')

						const [year, month, day] = value.split('.')

						// @ts-expect-error test
						return new Date(+year, +month - 1, +day)
					}
				}
			}
		)

		await run(runParams)
	})
})
