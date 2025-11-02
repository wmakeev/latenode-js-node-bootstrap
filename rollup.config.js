import { readFileSync } from 'fs'
import path from 'path'
import { defineConfig } from 'rollup'

const packageJson = JSON.parse(
	readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
)

export default defineConfig({
	input: 'src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'esm'
	},
	external: [
		'node:assert',
		'node:events',
		'date-fns/locale/ru',
		...Object.keys(packageJson.dependencies ?? {})
	]
})
