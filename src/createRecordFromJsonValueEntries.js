// @ts-check

/**
 * @param {[string, string][]} stringToStringEntries
 * @param { Nodul.CustomParamsConfigValue } paramConfig
 * @returns { unknown }
 */
export function createRecordFromJsonValueEntries(
	stringToStringEntries,
	paramConfig
) {
	if (paramConfig.required === false && stringToStringEntries.length === 0)
		return undefined

	return Object.fromEntries(
		stringToStringEntries.map(([k, v]) => {
			try {
				if (v === '') return [k, undefined]
				else if (v == null) return [k, null]
				else if (typeof v !== 'string') return [k, v]
				else return [k, JSON.parse(v)]
			} catch (err) {
				throw new TypeError(
					`Incorrect "${k}" key JSON value in custom parameter "${paramConfig.title}"`
				)
			}
		})
	)
}
