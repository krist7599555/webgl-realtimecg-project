import preprocess from 'svelte-preprocess'; 
import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
	kit: {
		host: "https://webgl-realtimecg-project.pages.dev",
		adapter: adapter(),
		target: '#svelte',
		vite: {
			resolve: {
				alias: {
					// 'stanford-dragon/4': './node_modules/stanford-dragon/4.js'
				}
			}
		}
	}
};

export default config;
