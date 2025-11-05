<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resizeCanvas();

		// Fill canvas with black background
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Drawing settings
		ctx.strokeStyle = '#ffffff'; // White drawing
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Handle window resize
		const handleResize = () => {
			resizeCanvas();
		};
		window.addEventListener('resize', handleResize);

		// Drawing and WebSocket disabled

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function resizeCanvas() {
		// Save current drawing
		const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

		// Resize canvas
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Restore drawing settings
		if (ctx) {
			// Fill with black background
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.strokeStyle = '#00ff41';
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			// Restore previous drawing if it existed
			if (imageData) {
				ctx.putImageData(imageData, 0, 0);
			}
		}
	}
</script>

<canvas bind:this={canvas} class="drawable-canvas" />

<style>
	.drawable-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		pointer-events: none;
	}
</style>
