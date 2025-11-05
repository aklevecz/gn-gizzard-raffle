<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let { showVideo = false, onWebGLStatusChange } = $props<{
		showVideo?: boolean;
		onWebGLStatusChange?: (failed: boolean) => void;
	}>();

	let container: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let vinyl: THREE.Mesh;
	let isDragging = false;
	let previousMousePosition = { x: 0 };
	let rotationVelocity = 0.01;
	let isHovering = false;
	let videoElement: HTMLVideoElement | null = null;
	let imageTexture: THREE.Texture | null = null;
	let videoTexture: THREE.VideoTexture | null = null;
	let isSnappingToFront = false;
	let targetRotation = 0;
	let debugInfo = $state('Component loaded - waiting for mount...');
	let webglFailed = $state(false);

	// Available videos in the visuals folder
	const videos = [
		'/visuals/almost_soldout.mp4',
		'/visuals/dinosaur_small.mp4',
		'/visuals/dive.mp4',
		'/visuals/gizz_flowers2.mp4',
		'/visuals/mononoke_bubbles.mp4',
		'/visuals/mononoke_wolves.mp4',
		'/visuals/picasso_frog.mp4'
	];

	// Randomly select a video
	const selectedVideo = videos[Math.floor(Math.random() * videos.length)];

	onMount(() => {
		// Skip Three.js setup if already failed
		if (webglFailed) {
			return;
		}

		try {
			debugInfo = 'onMount started...';

			if (!container) {
				debugInfo = 'ERROR: container is undefined';
				return;
			}

			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;
			const computedStyle = window.getComputedStyle(container);

			debugInfo = `Container: ${containerWidth}x${containerHeight}\nComputed: ${computedStyle.width} x ${computedStyle.height}\nWindow: ${window.innerWidth}x${window.innerHeight}`;

			// Scene setup
			if (!THREE) {
				debugInfo += '\nERROR: THREE is undefined';
				return;
			}
			debugInfo += '\nTHREE loaded OK';

			scene = new THREE.Scene();
			scene.background = new THREE.Color(0x000000); // Black background
			debugInfo += '\nScene created';

		// CRITICAL FIX: On mobile, container might report 0 height initially
		// Force minimum dimensions if container has no size
		const width = containerWidth > 0 ? containerWidth : 400;
		const height = containerHeight > 0 ? containerHeight : 400;

		debugInfo += `\nUsing: ${width}x${height}`;

		// Camera setup
		camera = new THREE.PerspectiveCamera(
			50,
			width / height,
			0.1,
			1000
		);
		camera.position.z = 4;

		// Renderer setup
		try {
			debugInfo += '\nCreating renderer...';

			// Check WebGL support first
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) {
				debugInfo += '\nERROR: WebGL not supported - showing fallback image';
				webglFailed = true;
				onWebGLStatusChange?.(true);
				return;
			}
			debugInfo += '\nWebGL context OK';

			renderer = new THREE.WebGLRenderer({
				antialias: false, // Disable on mobile for compatibility
				alpha: false,
				powerPreference: 'default', // Use default instead of high-performance
				precision: 'lowp', // Use low precision for mobile
				stencil: false,
				depth: true,
				failIfMajorPerformanceCaveat: false
			});
			debugInfo += '\nRenderer created';

			if (!renderer) {
				debugInfo += '\nERROR: renderer is null';
				webglFailed = true;
				onWebGLStatusChange?.(true);
				return;
			}

			if (!renderer.domElement) {
				debugInfo += '\nERROR: renderer.domElement is undefined!';
				debugInfo += `\nrenderer type: ${typeof renderer}`;
				debugInfo += `\nrenderer keys: ${Object.keys(renderer).join(', ')}`;
				webglFailed = true;
				onWebGLStatusChange?.(true);
				return;
			}

			debugInfo += '\nSetting renderer size...';
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.toneMapping = THREE.NoToneMapping;
			renderer.outputColorSpace = THREE.SRGBColorSpace;

			debugInfo += '\nAppending canvas...';
			container.appendChild(renderer.domElement);

			debugInfo += `\nCanvas: ${renderer.domElement.width}x${renderer.domElement.height}`;
			debugInfo += `\nPixelRatio: ${renderer.getPixelRatio()}`;
			debugInfo += `\nWebGL: OK`;
		} catch (e: any) {
			debugInfo += `\nWebGL ERROR: ${e}\n${e.stack}`;
			webglFailed = true;
			onWebGLStatusChange?.(true);
			return;
		}

		// Create flat box geometry (vinyl record cover shape - very thin depth)
		const geometry = new THREE.BoxGeometry(2, 2, 0.05);

		// Load static image texture
		const textureLoader = new THREE.TextureLoader();
		imageTexture = textureLoader.load('/lizard_cover_1024.jpg');
		imageTexture.colorSpace = THREE.SRGBColorSpace;

		// Create video element and texture (but don't use it yet)
		videoElement = document.createElement('video');
		videoElement.src = selectedVideo;
		videoElement.crossOrigin = 'anonymous';
		videoElement.loop = true;
		videoElement.muted = true;
		videoElement.playsInline = true;

		videoTexture = new THREE.VideoTexture(videoElement);
		videoTexture.colorSpace = THREE.SRGBColorSpace;

		// Create materials array - start with image texture
		const materials = [
			new THREE.MeshBasicMaterial({ color: 0x000000 }), // Right edge
			new THREE.MeshBasicMaterial({ color: 0x000000 }), // Left edge
			new THREE.MeshBasicMaterial({ color: 0x000000 }), // Top edge
			new THREE.MeshBasicMaterial({ color: 0x000000 }), // Bottom edge
			new THREE.MeshBasicMaterial({ map: imageTexture }), // Front
			new THREE.MeshBasicMaterial({ map: imageTexture }) // Back
		];

		vinyl = new THREE.Mesh(geometry, materials);
		scene.add(vinyl);

		// Mouse and touch event handlers
		const handleStart = (clientX: number) => {
			isDragging = true;
			previousMousePosition = { x: clientX };
		};

		const handleMove = (clientX: number) => {
			if (isDragging) {
				const deltaX = clientX - previousMousePosition.x;
				vinyl.rotation.y += deltaX * 0.01;
				previousMousePosition = { x: clientX };
			}
		};

		const handleEnd = () => {
			isDragging = false;
		};

		const handleMouseDown = (event: MouseEvent) => {
			handleStart(event.clientX);
		};

		const handleMouseMove = (event: MouseEvent) => {
			handleMove(event.clientX);
		};

		const handleMouseUp = () => {
			handleEnd();
		};

		const handleTouchStart = (event: TouchEvent) => {
			if (event.touches.length > 0) {
				handleStart(event.touches[0].clientX);
			}
		};

		const handleTouchMove = (event: TouchEvent) => {
			if (event.touches.length > 0) {
				event.preventDefault();
				handleMove(event.touches[0].clientX);
			}
		};

		const handleTouchEnd = () => {
			handleEnd();
		};

		const handleMouseEnter = () => {
			isHovering = true;
		};

		const handleMouseLeave = () => {
			isHovering = false;
			isDragging = false;
		};

		// Add mouse event listeners
		renderer.domElement.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		renderer.domElement.addEventListener('mouseenter', handleMouseEnter);
		renderer.domElement.addEventListener('mouseleave', handleMouseLeave);

		// Add touch event listeners
		renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
		renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
		renderer.domElement.addEventListener('touchend', handleTouchEnd);
		renderer.domElement.addEventListener('touchcancel', handleTouchEnd);

		// Handle window resize
		const handleResize = () => {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		};
		window.addEventListener('resize', handleResize);

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);

			// Handle snapping to front when video starts
			if (isSnappingToFront) {
				const diff = targetRotation - vinyl.rotation.y;
				if (Math.abs(diff) > 0.01) {
					// Smoothly rotate towards target
					vinyl.rotation.y += diff * 0.1;
				} else {
					// Snap to exact position
					vinyl.rotation.y = targetRotation;
					isSnappingToFront = false;
				}
			}
			// Auto-rotate when not dragging and not showing video (Y-axis only)
			else if (!isDragging && !showVideo) {
				const speed = isHovering ? 1.5 : 1; // Faster rotation on hover
				vinyl.rotation.y += rotationVelocity * speed;
			}

			// Scale effect on hover
			const targetScale = isHovering ? 1.1 : 1;
			vinyl.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

			renderer.render(scene, camera);
		};

			animate();

			// Cleanup
			return () => {
				renderer.domElement.removeEventListener('mousedown', handleMouseDown);
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
				renderer.domElement.removeEventListener('mouseenter', handleMouseEnter);
				renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
				renderer.domElement.removeEventListener('touchstart', handleTouchStart);
				renderer.domElement.removeEventListener('touchmove', handleTouchMove);
				renderer.domElement.removeEventListener('touchend', handleTouchEnd);
				renderer.domElement.removeEventListener('touchcancel', handleTouchEnd);
				window.removeEventListener('resize', handleResize);
				renderer.dispose();
				geometry.dispose();
				materials.forEach((material) => material.dispose());
				if (imageTexture) imageTexture.dispose();
				if (videoTexture) videoTexture.dispose();
				if (videoElement) {
					videoElement.pause();
					videoElement.src = '';
				}
				container.removeChild(renderer.domElement);
			};
		} catch (error: any) {
			debugInfo = `MOUNT ERROR: ${error}\n${error.stack}`;
			webglFailed = true;
			onWebGLStatusChange?.(true);
		}
	});

	// React to showVideo prop changes
	$effect(() => {
		if (!vinyl || !imageTexture || !videoTexture || !videoElement) return;

		const materials = vinyl.material as THREE.MeshBasicMaterial[];

		if (showVideo) {
			// Calculate nearest front-facing rotation (multiple of 2π)
			const currentRotation = vinyl.rotation.y;
			const twoPi = Math.PI * 2;
			const nearestMultiple = Math.round(currentRotation / twoPi) * twoPi;
			targetRotation = nearestMultiple;
			isSnappingToFront = true;

			// Switch to video
			materials[4].map = videoTexture;
			materials[5].map = videoTexture;
			materials[4].needsUpdate = true;
			materials[5].needsUpdate = true;
			videoElement.play().catch((err) => console.error('Error playing video:', err));
		} else {
			// Switch to image
			isSnappingToFront = false;
			materials[4].map = imageTexture;
			materials[5].map = imageTexture;
			materials[4].needsUpdate = true;
			materials[5].needsUpdate = true;
			if (videoElement) {
				videoElement.pause();
				videoElement.currentTime = 0;
			}
		}
	});
</script>

<div bind:this={container} class="vinyl-cube-container">
	{#if webglFailed}
		<div class="fallback-container">
			{#if showVideo}
				<video
					src={selectedVideo}
					class="fallback-video"
					autoplay
					loop
					muted
					playsinline
				/>
			{:else}
				<img src="/lizard_cover_1024.jpg" alt="Album Cover" class="fallback-image" />
			{/if}
		</div>
	{/if}
</div>

<style>
	.vinyl-cube-container {
		width: 100%;
		max-width: 600px;
		min-height: 400px;
		overflow: hidden;
		background: #000000;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.vinyl-cube-container:active {
		cursor: grabbing;
	}

	.fallback-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.fallback-image,
	.fallback-video {
		max-width: 90%;
		max-height: 400px;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	.fallback-text {
		color: #00ff41;
		font-size: 0.875rem;
		opacity: 0.7;
	}
</style>
