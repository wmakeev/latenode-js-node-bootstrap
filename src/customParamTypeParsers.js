// @ts-check

import assert from 'node:assert/strict'

/** @type { Record<string, (value: unknown, paramConfig: Nodul.CustomParamsConfigValue) => unknown> } */
export const customParamTypeParsers = {
	json: value => {
		if (value == null) return value
		if (typeof value !== 'string') return value

		// Error handled by parent
		return JSON.parse(value)
	},

	date: value => {
		if (value == null) return value
		assert.ok(typeof value === 'string' || typeof value === 'number')

		const date = new Date(value)

		if (Number.isNaN(date.getTime())) {
			throw new TypeError(`Invalid Date - "${value}"`)
		}

		return date
	}
}
