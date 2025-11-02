// @ts-check

import assert from 'node:assert/strict'
import { customParamTypeParsers } from './customParamTypeParsers.js'
import {
	embeddedParamTypeParsers,
	stringParser
} from './embeddedParamTypeParsers.js'
import { extractFieldTypeNotation } from './extractFieldTypeNotation.js'
import { typeOf } from './tools.js'

/**
 * @param { unknown } value
 * @param { Nodul.CustomParamsConfigValue } paramConfig
 * @returns
 */
export function parseCustomFieldValue(value, paramConfig) {
	const parseEmbeddedTypeParam = embeddedParamTypeParsers[paramConfig.type]

	value = parseEmbeddedTypeParam
		? parseEmbeddedTypeParam(value, paramConfig)
		: value

	const customTypeName = extractFieldTypeNotation(paramConfig.description)

	const parseCustomTypeParam =
		customTypeName != null ? customParamTypeParsers[customTypeName] : null

	if (parseCustomTypeParam) {
		// string_array
		if (paramConfig.type === 'string_array') {
			assert.ok(Array.isArray(value))

			value = value.map((val, index) => {
				try {
					return parseCustomTypeParam(stringParser(val), paramConfig)
				} catch (/** @type { any } */ err) {
					throw new TypeError(
						`Can't parse "${paramConfig.title}" parameter item` +
							` at index ${index} as ${customTypeName} type: ${err?.message}`,
						{ cause: err }
					)
				}
			})
		}

		// string_to_string
		else if (paramConfig.type === 'string_to_string') {
			assert.ok(typeOf(value) === '[object Object]')

			value = Object.fromEntries(
				Object.entries(/** @type { Record<string, string> } */ (value)).map(
					ent => {
						try {
							return [
								ent[0],
								parseCustomTypeParam(stringParser(ent[1]), paramConfig)
							]
						} catch (/** @type { any } */ err) {
							throw new TypeError(
								`Can't parse "${paramConfig.title}" parameter value` +
									` at key "${ent[0]}" as ${customTypeName} type: ${err?.message}`,
								{ cause: err }
							)
						}
					}
				)
			)
		}

		// default
		else {
			try {
				value = parseCustomTypeParam(value, paramConfig)
			} catch (/** @type { any } */ err) {
				throw new TypeError(
					`Can't parse "${paramConfig.title}" parameter value` +
						` as ${customTypeName} type: ${err?.message}`
				)
			}
		}
	}

	if (paramConfig.required && value == null)
		throw new TypeError(`Custom parameter "${paramConfig.title}" is required`)

	return value
}
