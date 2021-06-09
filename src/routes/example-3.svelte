<canvas bind:this={canvas} style="width: 100%; height: 60%" />
<article class='container'>
	<h1>Triangle</h1>
	<p>just boring triangle to show that webgl is just 2D graphic render</p>
</article>
<slot />

<script lang="ts">
import { onMount } from 'svelte';
import {
	createProgramInfo,
	createBufferInfoFromArrays,
	setBuffersAndAttributes,
	drawBufferInfo,
	setUniforms
} from 'twgl.js';

let canvas: HTMLCanvasElement;

onMount(async () => {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	const gl = canvas.getContext('webgl');
	const programInfo = createProgramInfo(gl, [
		` 
        uniform mat4 u_model;
        uniform mat4 u_view;
        uniform mat4 u_projection;
        attribute vec3 a_position;
        attribute vec3 a_normal;
        attribute vec3 a_texture;

        varying vec3 v_normal;

        void main() {
          gl_Position = vec4(a_position.xyz, 1);
        }
      `,
		` 
        precision mediump float;
        varying vec3 v_normal;

        void main() {
          gl_FragColor = vec4(1, 0, 0, 1);
        }`
	]);
	gl.useProgram(programInfo.program);

	const bufferInfo = createBufferInfoFromArrays(gl, {
		a_position: { numComponents: 3, data: [-1, -1, 0, 1, -1, 0, 1, 1, 0] }
	});
	setUniforms(programInfo, {
		// time: time * 0.001,
		// resolution: [gl.canvas.width, gl.canvas.height],
	});
	setBuffersAndAttributes(gl, programInfo, bufferInfo);
	drawBufferInfo(gl, bufferInfo);
});
</script>
