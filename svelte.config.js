import preprocess from 'svelte-preprocess'; 
import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
	kit: {
		// host: "https://krist7599555.github.io",
		adapter: adapter(),
		paths: {
			base: "/webgl-realtimecg-project"
			// https://krist7599555.github.io/webgl-realtimecg-project
		},
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	}
};

export default config;
