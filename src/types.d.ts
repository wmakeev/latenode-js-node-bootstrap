namespace Nodul {
	interface DataRecord {
		[P: string]: unknown

		/** JS-node function code */
		code: string

		use_bun: boolean

		resultVariable?: string

		resultSelector?: string

		shouldHandleError?: boolean

		errorVariable?: string
	}

	interface RunParams {
		data: DataRecord

		store: {
			setVariable(resultVariable: string, result: unknown)
		}
	}

	type RunResults =
		| {
				result: unknown
				error: null
		  }
		| {
				result: null
				error: Error
		  }

	type RunFunction = (params: RunParams) => Promise<RunResults>

	interface LogicParams {
		params: Record<string, unknown>
		customParamsConfig: CustomParamsConfig | null
	}

	type LogicFunction = (
		runParams: RunParams,
		logicParams: LogicParams
	) => Promise<unknown>

	type CustomParamBase = {
		title: string
		required: boolean
		description: string
	}

	type CustomParam =
		| {
				type: 'connection'
		  }
		| {
				type: 'string'
				options?: {
					minLength: number
				}
		  }
		| {
				type: 'int'
				options?: {
					min?: number
					max?: number
				}
		  }
		| {
				type: 'string_array'
				options?: {
					maxCount?: string
				}
		  }
		| {
				type: 'string_to_string'
				options?: {
					maxCount?: number
				}
		  }
		| {
				type: 'select'
				options?: {
					options?: { key: string; value: string }[]
					multiple?: boolean
				}
		  }
		| {
				type: 'bool'
		  }

	type CustomParamsConfigValue = CustomParam & CustomParamBase

	type CustomParamsConfig = Record<string, CustomParamsConfigValue>
}
