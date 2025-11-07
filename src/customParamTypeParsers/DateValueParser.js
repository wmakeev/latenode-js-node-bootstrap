import assert from 'node:assert/strict'

/** @type { Nodul.CustomTypeParser } */
export const DateValueParser = value => {
	if (value == null) return value
	assert.ok(typeof value === 'string' || typeof value === 'number')

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		throw new TypeError(`Invalid Date - "${value}"`)
	}

	return date
}
