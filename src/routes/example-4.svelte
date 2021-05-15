<svelte:window on:resize={() => (must_resize = true)} />
<canvas bind:this={canvas} style="width: 100%; height: 100%" />
<slot />

<script lang="ts">
import { onMount } from 'svelte';
import * as twgl from 'twgl.js';
import { Matrix4, toRadians } from '@math.gl/core';

// https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html
let canvas: HTMLCanvasElement;
let must_resize = true;

const VERTEX_SHADER = `	
		attribute vec4 a_position;
		attribute vec2 a_texcoord;
		uniform mat4 u_matrix;
		varying vec2 v_texcoord;
		void main() {
			gl_Position = u_matrix * a_position;
			v_texcoord = a_texcoord;
		}
	`;
const FRAGMENT_SHADER = `
		precision mediump float;
		varying vec2 v_texcoord;
		uniform sampler2D u_texture;
		void main() {
			gl_FragColor = texture2D(u_texture, v_texcoord);
		}
	`;

onMount(() => {
	const gl = canvas.getContext('webgl');
	var programInfo = twgl.createProgramInfo(gl, [VERTEX_SHADER, FRAGMENT_SHADER]);

	const cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, {
		a_position: { numComponents: 3, data: getPosition() },
		a_texcoord: { numComponents: 2, data: getTexcoords() }
	});

	const scottPatternTexture = twgl.createTexture(gl, {
		width: 3,
		height: 3,
		format: gl.LUMINANCE, // what you pass https://www.khronos.org/registry/OpenGL-Refpages/es3.1/html/glTexImage2D.xhtml
		internalFormat: gl.LUMINANCE, // what gpu store, luminance value three times for red, green, and blue and attaching 1 for alpha
		minMag: gl.NEAREST,
		wrap: gl.CLAMP_TO_EDGE,
		src: new Uint8Array([128, 64, 128, 0, 192, 0, 50, 90, 110])
	});

	// Create a texture to render to
	const targetTextureWidth = 800;
	const targetTextureHeight = 800;
	const targetTexture = twgl.createTexture(gl, {
		width: targetTextureWidth,
		height: targetTextureHeight,
		format: gl.RGBA,
		internalFormat: gl.RGBA,
		minMag: gl.LINEAR,
		wrap: gl.CLAMP_TO_EDGE,
		src: null // will drawCube(scottPatternTexture) inside it
	});

	// Create and bind the framebuffer
	const scottPatternFrameBufferInfo = twgl.createFramebufferInfo(
		gl,
		[
			{
				attachmentPoint: gl.COLOR_ATTACHMENT0,
				target: gl.TEXTURE_2D,
				level: 0,
				attachment: targetTexture
			}
		],
		targetTextureWidth,
		targetTextureHeight
	); // set size to apply view port

	function drawCube({ aspect, texture, rotateX = 0, rotateY = 0 }) {
		twgl.setUniforms(programInfo, {
			u_texture: texture,
			u_matrix: new Matrix4()
				.identity()
				.multiplyRight(
					new Matrix4().perspective({ fovy: toRadians(60), aspect, near: 1, far: 2000 })
				)
				.multiplyRight(new Matrix4().lookAt([0, 0, 2], [0, 0, 0], [0, 1, 0]))
				.rotateX(rotateX)
				.rotateY(rotateY)
		});
		twgl.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
		twgl.drawBufferInfo(gl, cubeBufferInfo, gl.TRIANGLES);
	}

	/** SETUP RENDER */ {
		gl.useProgram(programInfo.program);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		window.addEventListener('resize', () => (must_resize = true));
	}

	function render(time: number) {
		const modelXRotation = toRadians(-0.07 * time);
		const modelYRotation = toRadians(-0.08 * time);
		if (must_resize) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			must_resize = false;
		}

		/* DRAW ON FRAME BUFFER */ {
			twgl.bindFramebufferInfo(gl, scottPatternFrameBufferInfo, gl.FRAMEBUFFER);
			gl.clearColor(0, 0, 1, 1); // set clearcolor of FBO
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			drawCube({
				aspect: targetTextureWidth / targetTextureHeight,
				texture: scottPatternTexture,
				rotateX: modelXRotation,
				rotateY: modelYRotation
			});
		}

		/* DRAW ON CANVAS */ {
			twgl.bindFramebufferInfo(gl, null); // render to the canvas
			gl.clearColor(1, 0, 1, 1); // set clearcolor of canvas
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			drawCube({
				aspect: gl.drawingBufferWidth / gl.drawingBufferHeight,
				texture: targetTexture,
				rotateX: modelXRotation,
				rotateY: modelYRotation
			});
		}
		requestAnimationFrame(render);
	} // end Render

	requestAnimationFrame(render);
}); // end onMount()

function getPosition() {
	// prettier-ignore
	return new Float32Array([
		-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5,
		-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,
		-0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,-0.5,
		-0.5,-0.5,-0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,
		-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,
		0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,-0.5,0.5,0.5,0.5
	]);
}
function getTexcoords() {
	// prettier-ignore
	return new Float32Array([0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1,0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1,0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,1,1,0,1,0,0,1,1,1]);
}
</script>
