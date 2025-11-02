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

		t.plan(3)

		const run = getRun(async (params1, params2) => {
			t.assert.equal(params1, params)

			t.assert.deepEqual(params2.params, {})
			t.assert.equal(params2.customParamsConfig, null)

			console.log('getRun')
		})

		await run(params)
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
				t.plan(3)

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
						}
					},
					{
						jsonParam1: '{ "foo": 42, "bar": "baz" }',
						jsonParam2: '',
						jsonParam3: 'null'
					}
				)

				const run = getRun(async (_, { params }) => {
					t.assert.deepEqual(params['jsonParam1'], { foo: 42, bar: 'baz' })
					t.assert.deepEqual(params['jsonParam2'], undefined)
					t.assert.deepEqual(params['jsonParam3'], null)
				})

				await run(runParams)
			})

			test('Date', async (/** @type { TestContext } */ t) => {
				t.plan(4)

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
						}
					},
					{
						dateParam1: '2025-11-02T09:34:26.234Z',
						dateParam2: '',
						dateParam3: 'null'
					}
				)

				const run = getRun(async (_, { params }) => {
					const param1 = params['dateParam1']
					t.assert.ok(param1 instanceof Date)
					t.assert.equal(param1.toJSON(), '2025-11-02T09:34:26.234Z')

					t.assert.deepEqual(params['dateParam2'], undefined)
					t.assert.deepEqual(params['dateParam3'], null)
				})

				await run(runParams)
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

	suite.only('string_array', () => {
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
})
