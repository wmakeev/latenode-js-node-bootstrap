// @ts-check

/** @type { Nodul.CustomTypeParser } */
export const JsonValueParser = value => {
	if (value == null) return value
	if (typeof value !== 'string') return value

	// Error handled by parent
	return JSON.parse(value)
}
