<nav>
	<a href="/">readme</a>
	<a href="/example-1">three-normal</a>
	<a href="/example-2">three-gltf</a>
	<a href="/example-3">red-triangle</a>
	<a href="/example-4">framebufferobject</a>
	<a href="/example-5">shadow-map</a>
</nav>

<head>
	<link rel="stylesheet" href="/main.css">
</head>

<slot />

<style>
	nav {
	  display: flex;
    justify-content: center;
		flex-wrap: wrap;
	}
	nav > a {
    padding: 4px
	}
</style>
