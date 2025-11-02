// @ts-check

import jmespath from 'jmespath'
import { CUSTOM_PARAMS_CONFIG_REGEX } from './consts.js'
import { parseDataRecord } from './parseDataRecord.js'

/**
 *
 * @param { Nodul.LogicFunction } logic
 * @param { Nodul.RunParams } params
 * @returns { Promise<Nodul.RunResults> }
 */
async function run(logic, params) {
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
					: parseDataRecord(params.data, customParamsConfig),
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

		if (
			typeof resultVariable === 'string' &&
			resultVariable.trim() !== '' &&
			resultVariable !== 'null'
		) {
			if (resultVariable !== resultVariable.trim())
				throw new TypeError(
					`Extra spaces in result variable name - "${resultVariable}"`
				)
			await params.store.setVariable(resultVariable, result)
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
 * @returns { Nodul.RunFunction }
 */
export function getRun(logic) {
	return async params => run(logic, params)
}

// TODO Base64 parse
