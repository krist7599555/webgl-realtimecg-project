<canvas bind:this={canvas} />
<article class="container">
	<h1>Normal Map</h1>
	<p>how it look like when display in normal map (display vec3 as rgb)</p>
	<p>writing in THREE.js</p>
</article>
<slot />

<script lang="ts">
import { onMount } from 'svelte';
import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	Color,
	Mesh,
	SphereGeometry,
	MeshNormalMaterial
} from 'three';

let canvas: HTMLCanvasElement;
onMount(() => {

	const width = window.innerWidth
	const height = Math.max(500, Math.min(window.innerHeight * 0.6, 700))

	console.log('example -1')
	const scene = new Scene();
	const box = new Mesh(new SphereGeometry(5, 32, 32), new MeshNormalMaterial());
	box.position.set(0, 0, 0);
	scene.add(box);

	const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
	camera.position.set(15, 5, 5);
	camera.lookAt(0, 0, 0);
	const renderer = new WebGLRenderer({ canvas });
	renderer.autoClearColor = true;
	scene.background = new Color(0.2, 0, 0.4);
	renderer.setSize(width, height);
	renderer.render(scene, camera);
});
</script>
