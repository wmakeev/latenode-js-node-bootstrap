// @ts-check

import assert from 'node:assert/strict'

/**
 * @param {unknown} value
 * @returns { string | null | undefined }
 */
export const stringParser = value => {
	if (value === 'null') return null
	if (value === '') return undefined
	if (typeof value !== 'string') return String(value)
	return value
}

/** @type { Record<string, (value: unknown, paramConfig: Nodul.CustomParamsConfigValue) => unknown> } */
export const embeddedParamTypeParsers = {
	connection: (value, paramConfig) => {
		if (value == null || value === '')
			return paramConfig.required === true ? null : undefined

		try {
			return JSON.parse(/** @type { any } */ (value))
		} catch (err) {
			return value
		}
	},

	string: stringParser,

	int: (value, paramConfig) => {
		if (paramConfig.required === false && value === 0) return undefined
		else return value
	},

	bool: (value, paramConfig) => {
		if (paramConfig.required === false && value === false) return undefined
		else return value
	},

	string_array: value => {
		assert.ok(value != null)
		assert.ok(Array.isArray(value))

		return value.map(val => stringParser(val))
	},

	string_to_string: value => {
		assert.ok(value != null)
		assert.ok(typeof value === 'object')

		const entries = Object.entries(value).map(
			/** @param { [string, unknown] } ent */
			ent => [ent[0], stringParser(ent[1])]
		)

		return Object.fromEntries(entries)
	},

	select: value => {
		if (value == null) return value
		assert.ok(Array.isArray(value))
		return value?.[0]
	}
}
