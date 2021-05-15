<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Scene,
		PerspectiveCamera,
		WebGLRenderer,
		Color,
		Mesh,
		Sphere,
		Vector3,
		Material,
		SphereGeometry,
		MeshBasicMaterial,
		MeshLambertMaterial,
		MeshNormalMaterial,
		DirectionalLight,
		CameraHelper,
		PCFSoftShadowMap,
		PlaneGeometry
	} from 'three';
	import { OrbitControls } from '../libs/OrbitControls';
	import { GLTFLoader } from '../libs/GLTFLoader';
	let canvas: HTMLCanvasElement;
	onMount(async () => {
		const scene = new Scene();
		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync('/model/stick.gltf');

		gltf.scene.traverse((node: any) => {
			if (node.isMesh) {
				node.castShadow = true;
				node.receiveShadow = true;
			}
		});
		scene.add(gltf.scene);
		console.log(gltf);

		const light = new DirectionalLight(0xffffff, 0.5);
		scene.add(light);

		const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(15, 5, 5);
		camera.lookAt(0, 0, 0);

		const renderer = new WebGLRenderer({ canvas, antialias: true });
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = PCFSoftShadowMap;
		renderer.autoClearColor = true;
		scene.background = new Color(0.8, 0, 0.3);
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);

		scene.add(new CameraHelper(camera));

		const plane = new Mesh(new PlaneGeometry(30, 30), new MeshBasicMaterial());
		plane.rotateY(20);
		plane.rotateX(-20);
		plane.castShadow = true;
		plane.receiveShadow = true;
		scene.add(plane);

		const controls = new OrbitControls(camera, renderer.domElement);

		function animate() {
			requestAnimationFrame(animate);
			// required if controls.enableDamping or controls.autoRotate are set to true
			controls.update();
			renderer.render(scene, camera);
		}
		animate();
	});
</script>

<canvas bind:this={canvas} style="width: 100%; height: 100%" />
<slot />
