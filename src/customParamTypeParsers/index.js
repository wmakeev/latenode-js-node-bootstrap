// @ts-check

import { DateValueParser } from './DateValueParser.js'
import { JsonValueParser } from './JsonValueParser.js'

/** @type { Record<string, Nodul.CustomTypeParser> } */
export const customParamTypeParsers = {
	json: JsonValueParser,
	date: DateValueParser
}
