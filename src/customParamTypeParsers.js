// @ts-check

import assert from 'node:assert/strict'
import { createRecordFromJsonValueEntries } from './createRecordFromJsonValueEntries.js'
import { typeOf } from './tools.js'

/** @type { Record<string, (value: unknown, paramConfig: Nodul.CustomParamsConfigValue) => unknown> } */
export const customParamTypeParsers = {
	json: (value, paramConfig) => {
		if (value == null) return value

		// Array of json strings
		if (Array.isArray(value) && paramConfig.type === 'string_array') {
			return value.map((v, index) => {
				if (v === '') return undefined

				try {
					return JSON.parse(v)
				} catch (err) {
					throw new TypeError(
						`Incorrect JSON item at index ${index} in custom parameter "${paramConfig.title}"`
					)
				}
			})
		}

		// Object with json values
		if (
			typeOf(value) === '[object Object]' &&
			paramConfig.type === 'string_to_string'
		) {
			return createRecordFromJsonValueEntries(
				[...Object.entries(value)],
				paramConfig
			)
		}

		if (typeof value !== 'string') return value

		try {
			return JSON.parse(value)
		} catch (err) {
			throw new TypeError(
				`Incorrect JSON custom parameter "${paramConfig.title}"`
			)
		}
	},

	date: (value, paramConfig) => {
		if (value == null) return value
		assert.ok(typeof value === 'string' || typeof value === 'number')

		const date = new Date(value)

		if (Number.isNaN(date.getTime())) {
			throw new TypeError(
				`Invalid Date custom parameter "${paramConfig.title}"`
			)
		}

		return date
	}
}
