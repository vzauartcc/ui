import js from '@eslint/js';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
	{
		name: 'app/files-to-lint',
		files: ['**/*.{js,mjs,jsx,vue}'],
	},

	{
		ignores: ['src/assets/*'],
	},

	globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				M: true,
			},
		},
	},

	js.configs.recommended,
	...pluginVue.configs['flat/essential'],
	skipFormatting,

	{
		rules: {
			'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
			'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
			indent: ['warn', 'tab', { SwitchCase: 1 }],
			'no-tabs': ['warn', { allowIndentationTabs: true }],
			'vue/multi-word-component-names': 'off',
		},
	},
]);
