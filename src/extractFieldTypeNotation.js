// @ts-check

/**
 * @param { string } [desc]
 * @returns { string | null }
 */
export function extractFieldTypeNotation(desc) {
	const match = desc?.match(/^\*\*([^*]+)\*\*/)
	const type = match?.[1]
	return typeof type === 'string' ? type.toLowerCase() : null
}
