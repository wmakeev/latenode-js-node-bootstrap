// @ts-check

import jmespath from 'jmespath'
import { CUSTOM_PARAMS_CONFIG_REGEX } from './consts.js'
import { parseDataRecord } from './parseDataRecord.js'
import { customParamTypeParsers } from './customParamTypeParsers/index.js'

export * from './customParamTypeParsers/JsonValueParser.js'
export * from './customParamTypeParsers/DateValueParser.js'

/**
 *
 * @param { Nodul.LogicFunction } logic
 * @param { Nodul.RunParams } params
 * @param { Nodul.GetRunOptions } options
 * @returns { Promise<Nodul.RunResults> }
 */
async function run(logic, params, options) {
	try {
		/** @type { Nodul.CustomParamsConfig | null } */
		let customParamsConfig = null

		const match = params.data.code?.match(CUSTOM_PARAMS_CONFIG_REGEX)
		if (match != null) {
			const matchResult = match[1]

			if (matchResult != null)
				// TODO Error handler
				customParamsConfig = JSON.parse(matchResult)
		}

		const { resultVariable, resultSelector } = params.data

		let result = await logic(params, {
			params:
				customParamsConfig == null
					? {}
					: parseDataRecord(params.data, customParamsConfig, options),
			customParamsConfig
		})

		// resultSelector
		if (
			typeof resultSelector === 'string' &&
			resultSelector.trim() !== '' &&
			resultSelector !== 'null'
		) {
			result = jmespath.search(result, resultSelector)
		}

		// resultVariable
		if (
			typeof resultVariable === 'string' &&
			resultVariable.trim() !== '' &&
			resultVariable !== 'null'
		) {
			await params.store.setVariable(resultVariable.trim(), result)
		}

		return { result, error: null }
	} catch (/** @type { any } */ err) {
		const { errorVariable } = params.data

		const error = {
			name: err?.name,
			code: err?.code,
			message: err?.message,
			stack: err?.stack
		}

		if (
			typeof errorVariable === 'string' &&
			errorVariable.trim() !== '' &&
			errorVariable !== 'null'
		) {
			await params.store.setVariable(errorVariable, error)
		}

		if (params.data.shouldHandleError !== true) throw err

		return { result: null, error }
	}
}

/**
 * @param { Nodul.LogicFunction } logic
 * @param { Nodul.GetRunOptions } [options]
 * @returns { Nodul.RunFunction }
 */
export function getRun(logic, options) {
	/** @type { Nodul.GetRunOptions } */
	const options_ = {
		...options,
		customParamTypeParsers: {
			...customParamTypeParsers,
			...options?.customParamTypeParsers
		}
	}

	return async params => run(logic, params, options_)
}
