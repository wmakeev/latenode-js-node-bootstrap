// @ts-check

import assert from 'node:assert/strict'
import { parseCustomFieldValue } from './parseCustomFieldValue.js'

/**
 * @param { Nodul.DataRecord } data
 * @param { Nodul.CustomParamsConfig } customParamsConfig
 * @returns { { [P: string]: unknown } }
 */
export function parseDataRecord(data, customParamsConfig) {
	/** @type { { [P: string]: unknown } } */
	const result = {}

	if (customParamsConfig == null) return result

	for (const [paramName, paramConfig] of Object.entries(customParamsConfig)) {
		const paramValue = data[paramName]

		const value = parseCustomFieldValue(paramValue, paramConfig)
		if (value === undefined) continue

		const keys = paramName.split('.')

		let current = result
		for (let i = 0; i < keys.length - 1; i++) {
			const currentKey = keys[i]
			assert.ok(typeof currentKey === 'string')

			if (
				!Object.hasOwn(current, currentKey) ||
				typeof current[currentKey] !== 'object' ||
				current[currentKey] === null
			) {
				current[currentKey] = {}
			}

			current = /** @type { typeof current } */ (current[currentKey])
		}

		const finalKey = keys[keys.length - 1]
		assert.ok(typeof finalKey === 'string')

		current[finalKey] = value
	}

	return result
}
