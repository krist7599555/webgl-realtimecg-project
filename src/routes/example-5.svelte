<script lang="ts">
import { onMount, tick } from 'svelte';
import { Matrix4 } from '@math.gl/core';
import flatten from 'lodash/flatten.js';
import * as twgl from 'twgl.js'

import stanfordDragon from 'stanford-dragon/4.js';

let canvasIsPressed = false;
let xRotation = Math.PI / 20;
let yRotation = 0;
let lastPressX = 0;
let lastPressY = 0;

function register_canvas_event(node: HTMLCanvasElement) {
  node.onmousedown = function (e) {
		canvasIsPressed = true;
		lastPressX = e.pageX;
		lastPressY = e.pageY;
	};
	node.onmouseup = function () {
		canvasIsPressed = false;
	};
	node.onmouseout = function () {
		canvasIsPressed = false;
	};
	node.onmousemove = function (e) {
		if (canvasIsPressed) {
			xRotation += (e.pageY - lastPressY) / 50;
			yRotation -= (e.pageX - lastPressX) / 50;

			xRotation = Math.min(xRotation, Math.PI / 2.5);
			xRotation = Math.max(xRotation, 0.1);

			lastPressX = e.pageX;
			lastPressY = e.pageY;
		}
	};

	// As you drag your finger we move the camera
	node.addEventListener('touchstart', function (e) {
		lastPressX = e.touches[0].clientX;
		lastPressY = e.touches[0].clientY;
	});
	node.addEventListener('touchmove', function (e) {
		e.preventDefault();
		xRotation += (e.touches[0].clientY - lastPressY) / 50;
		yRotation -= (e.touches[0].clientX - lastPressX) / 50;

		xRotation = Math.min(xRotation, Math.PI / 2.5);
		xRotation = Math.max(xRotation, 0.1);

		lastPressX = e.touches[0].clientX;
		lastPressY = e.touches[0].clientY;
	});

}

let canvas: HTMLCanvasElement;
let width: number
let height: number

onMount(async () => {
	await tick()
	await tick()
	await tick()
	width = window.innerWidth;
	// height = Math.min(window.innerHeight - 200, 1000);
	height = Math.max(400, Math.min(window.innerHeight - 200, 700))

  canvas.width = width
  canvas.height = height

	const gl = canvas.getContext('webgl');
	gl.enable(gl.DEPTH_TEST);

	/**
	 * Section 2 - Shaders
	 */

	// We create a vertex shader from the light's point of view. You never see this in the
	// demo. It is used behind the scenes to create a texture that we can use to test testing whether
	// or not a point is inside of our outside of the shadow
	const shadowDepthTextureSize = 1024;
  const A_POSITION = 'aVertexPosition'
  const U_MODEL_VIEW = 'uMVMatrix'
  const U_PROJECTION = 'uPMatrix'
  const U_LIGHT_MODEL_VIEW = 'uLightMViewMatrix'
  const U_LIGHT_PROJECTION = 'uLightProjectionMatrix'
	const U_DEPTH_TEXTURE = 'uDepthColorTexture'
	const U_COLOR = 'uColor'

	const lightVertexGLSL = `
attribute vec3 ${A_POSITION};

uniform mat4 ${U_PROJECTION};
uniform mat4 ${U_MODEL_VIEW};

void main (void) {
  gl_Position = ${U_PROJECTION} * ${U_MODEL_VIEW} * vec4(${A_POSITION}, 1.0);
}
`;

	const lightFragmentGLSL = `
precision mediump float;

vec4 encodeFloat (float depth) {
  const vec4 bitShift = vec4(
    256 * 256 * 256,
    256 * 256,
    256,
    1.0
  );
  const vec4 bitMask = vec4(
    0,
    1.0 / 256.0,
    1.0 / 256.0,
    1.0 / 256.0
  );
  vec4 comp = fract(depth * bitShift);
  comp -= comp.xxyz * bitMask;
  return comp;
}

void main (void) {
  // Encode the distance into the scene of this fragment.
  // We'll later decode this when rendering from our camera's
  // perspective and use this number to know whether the fragment
  // that our camera is seeing is inside of our outside of the shadow
  gl_FragColor = encodeFloat(gl_FragCoord.z);
}
`;

	// We create a vertex shader that renders the scene from the camera's point of view.
	// This is what you see when you view the demo
	const cameraVertexGLSL = `
attribute vec3 ${A_POSITION};

uniform mat4 ${U_PROJECTION};
uniform mat4 ${U_MODEL_VIEW};
uniform mat4 ${U_LIGHT_MODEL_VIEW};
uniform mat4 ${U_LIGHT_PROJECTION};

// Used to normalize our coordinates from clip space to (0 - 1)
// so that we can access the corresponding point in our depth color texture
const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

varying vec2 vDepthUv;
varying vec4 shadowPos;

void main (void) {
  gl_Position = ${U_PROJECTION} * ${U_MODEL_VIEW} * vec4(${A_POSITION}, 1.0);

  shadowPos = texUnitConverter * ${U_LIGHT_PROJECTION} * ${U_LIGHT_MODEL_VIEW} * vec4(${A_POSITION}, 1.0);
}
`;
	const cameraFragmentGLSL = `
precision mediump float;

varying vec2 vDepthUv;
varying vec4 shadowPos;

uniform sampler2D ${U_DEPTH_TEXTURE};
uniform vec3 ${U_COLOR};

float decodeFloat (vec4 color) {
  const vec4 bitShift = vec4(
    1.0 / (256.0 * 256.0 * 256.0),
    1.0 / (256.0 * 256.0),
    1.0 / 256.0,
    1
  );
  return dot(color, bitShift);
}

void main(void) {
  vec3 fragmentDepth = shadowPos.xyz;
  float shadowAcneRemover = 0.007;
  fragmentDepth.z -= shadowAcneRemover;

  float texelSize = 1.0 / ${shadowDepthTextureSize}.0;
  float amountInLight = 0.0;

  // Check whether or not the current fragment and the 8 fragments surrounding
  // the current fragment are in the shadow. We then average out whether or not
  // all of these fragments are in the shadow to determine the shadow contribution
  // of the current fragment.
  // So if 4 out of 9 fragments that we check are in the shadow then we'll say that
  // this fragment is 4/9ths in the shadow so it'll be a little brighter than something
  // that is 9/9ths in the shadow.
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float texelDepth = decodeFloat(texture2D(${U_DEPTH_TEXTURE}, fragmentDepth.xy + vec2(x, y) * texelSize));
      if (fragmentDepth.z < texelDepth) {
        amountInLight += 1.0;
      }
    }
  }
  amountInLight /= 9.0;

  gl_FragColor = vec4(amountInLight * ${U_COLOR}, 1.0);
}
`;

  const cameraShaderProgramInfo = twgl.createProgramInfo(gl, [cameraVertexGLSL, cameraFragmentGLSL])
	const lightShaderProgramInfo = twgl.createProgramInfo(gl, [lightVertexGLSL, lightFragmentGLSL])

	/**
	 * Setting up our buffered data
	 */

	// Set up the four corners of our floor quad so that
	// we can draw the floor
	const floorPositions: number[] = flatten([[-30, 0, 30], [30, 0, 30], [30, 0, -30], [-30, 0, -30]]);
	const floorIndices = flatten([[0, 1, 2], [0, 2, 3]]);

	const dragonPositions: number[] = flatten(stanfordDragon.positions).map(x => x / 10);
	const dragonIndices: number[] = flatten(stanfordDragon.cells);

	/**
	 * Camera shader setup
	 */

  const floor_buffer = twgl.createBufferInfoFromArrays(gl, {
    indices: new Uint16Array(floorIndices),
    [A_POSITION]: new Float32Array(floorPositions),
  })
  const dragon_buffer =  twgl.createBufferInfoFromArrays(gl, {
    indices: new Uint16Array(dragonIndices),
    [A_POSITION]: new Float32Array(dragonPositions),
  })

	/**
	 * Light shader setup
	 */

	gl.useProgram(lightShaderProgramInfo.program);

	// This section is the meat of things. We create an off screen frame buffer that we'll render
	// our scene onto from our light's viewpoint. We output that to a color texture `shadowDepthTexture`.
	// Then later our camera shader will use `shadowDepthTexture` to determine whether or not fragments
	// are in the shadow.
  

	const renderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, shadowDepthTextureSize, shadowDepthTextureSize);
    
  const shadowFramebufferInfo = twgl.createFramebufferInfo(gl, [
    { target: gl.TEXTURE_2D, minMag: gl.NEAREST }, // create from gl.framebufferTexture2D
    { attachmentPoint: gl.DEPTH_ATTACHMENT, attachment: renderBuffer }, // attach WebGLRenderbuffer
  ], shadowDepthTextureSize, shadowDepthTextureSize);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	// We create an orthographic projection and view matrix from which our light
	// will vie the scene
	const light_projection_matrix = new Matrix4().ortho({ left: -40, right: 40, bottom: -40, top: 40, near: -40.0, far: 80 });
	const light_model_view_matrix = new Matrix4().lookAt([0, 2, -3], [0, 0, 0], [0, 1, 0]);

  twgl.setUniforms(lightShaderProgramInfo, {
    [U_PROJECTION]: light_projection_matrix,
    [U_MODEL_VIEW]: light_model_view_matrix
  })
  
  twgl.setBuffersAndAttributes(gl, lightShaderProgramInfo, floor_buffer)

	// gl.bindBuffer(gl.ARRAY_BUFFER, floorPositionBuffer);
	// gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIndices), gl.STATIC_DRAW);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	/**
	 * Scene uniforms
	 */
	gl.useProgram(cameraShaderProgramInfo.program);

  twgl.setUniforms(cameraShaderProgramInfo, {
    [U_LIGHT_MODEL_VIEW]: light_model_view_matrix,
    [U_LIGHT_PROJECTION]: light_projection_matrix,
    [U_PROJECTION]: new Matrix4().perspective({ fovy: Math.PI / 3, aspect: width / height, near: 0.01, far: 900 }),
    [U_DEPTH_TEXTURE]: shadowFramebufferInfo.attachments[0],
  })

	// We rotate the dragon about the y axis every frame
	let dragonRotateY = 0;

	// Draw our dragon onto the shadow map
	function drawShadowMap() {
		dragonRotateY += 0.01;

    twgl.bindFramebufferInfo(gl, shadowFramebufferInfo) // draw to this frame buffer
		gl.useProgram(lightShaderProgramInfo.program); // use this shader

		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    twgl.setBuffersAndAttributes(gl, lightShaderProgramInfo, dragon_buffer)
    twgl.setUniforms(lightShaderProgramInfo, {
      [U_MODEL_VIEW]: new Matrix4()
				.rotateY(dragonRotateY)
				.translate([0, 0, -3])
				.multiplyLeft(light_model_view_matrix)
    })
    twgl.drawBufferInfo(gl, dragon_buffer)
    twgl.bindFramebufferInfo(gl, null)
	}

	// Draw our dragon and floor onto the scene
	function drawModels() {
		gl.useProgram(cameraShaderProgramInfo.program);
		gl.viewport(0, 0, width, height);
		gl.clearColor(0.98, 0.98, 0.98, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let camera = new Matrix4()
      .rotateX(-xRotation)
      .rotateY(yRotation)
      .translate([0, 7, 25])

		camera = new Matrix4().lookAt([camera[12], camera[13], camera[14]], [0, 0, 0], [0, 1, 0]);

		var dragonModelMatrix = new Matrix4().rotateY(dragonRotateY).translate([0, 0, -3])

		// We use the light's model view matrix of our dragon so that our camera knows if
		// parts of the dragon are in the shadow
		
    twgl.setUniforms(cameraShaderProgramInfo, {
      [U_MODEL_VIEW]: new Matrix4(camera).multiplyRight(dragonModelMatrix),
      [U_LIGHT_MODEL_VIEW]: new Matrix4(light_model_view_matrix).multiplyRight(dragonModelMatrix),
			[U_PROJECTION]: new Matrix4().perspective({ fovy: Math.PI / 3, aspect: width / height, near: 0.01, far: 900 }),
      [U_COLOR]: [0.36, 0.66, 0.8],
    })
    twgl.drawBufferInfo(gl, dragon_buffer);   

    twgl.setUniforms(cameraShaderProgramInfo, {
      [U_MODEL_VIEW]: camera,
      [U_LIGHT_MODEL_VIEW]: light_model_view_matrix,
      [U_DEPTH_TEXTURE]: shadowFramebufferInfo.attachments[0],
      [U_COLOR]: [0.6, 0.6, 0.6],
    })
    twgl.setBuffersAndAttributes(gl, lightShaderProgramInfo, floor_buffer)
    twgl.drawBufferInfo(gl, floor_buffer);

	}

	// Draw our shadow map and light map every request animation frame
	function draw() {
		if (width != window.innerWidth) {
			width = canvas.width = window.innerWidth
		}
		drawShadowMap();
		drawModels();
		window.requestAnimationFrame(draw);
	}
	draw();
});
</script>

<canvas bind:this={canvas} use:register_canvas_event></canvas>
<article class='container'>
	<h1>Shadow Mapping</h1>
	<p>
		<a href="https://github.com/chinedufn/webgl-shadow-mapping-tutorial">tutorial</a>
	</p>
	<p>
		inspiration of shadow map is to render from camera perspective to framebuffer. framebuffer is same for render on screen as example-3 show which contain zyx + w. 
		we just reuse w from framebuffer to check is pixel (in fragment shader) should be light or shadow.
	</p>
	<p>
		code: 
		<a href='https://github.com/krist7599555/webgl-realtimecg-project/tree/master/src/routes/example-5.svelte' target="_blank">
			https://github.com/krist7599555/webgl-realtimecg-project/tree/master/src/example-5.svelte
		</a>
	</p>
</article>

<slot></slot>