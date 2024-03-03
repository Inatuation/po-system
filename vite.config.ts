import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import transformVue from './src/plugin/transform-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    transformVue(),
    AutoImport({
			resolvers: [ElementPlusResolver()],
		}),
		Components({
			resolvers: [ElementPlusResolver()],
		}),
  ],
  resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@common': fileURLToPath(new URL('./node_modules/xp-system-common', import.meta.url)),
		},
	},
})
