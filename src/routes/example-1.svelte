<canvas bind:this={canvas} style="width: 100%; height: 100%" />
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
	console.log('example -1')
	const scene = new Scene();
	const box = new Mesh(new SphereGeometry(5, 32, 32), new MeshNormalMaterial());
	box.position.set(0, 0, 0);
	scene.add(box);

	const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(15, 5, 5);
	camera.lookAt(0, 0, 0);
	const renderer = new WebGLRenderer({ canvas });
	renderer.autoClearColor = true;
	scene.background = new Color(0.2, 0, 0.4);
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.render(scene, camera);
});
</script>
