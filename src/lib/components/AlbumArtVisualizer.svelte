<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let {
		imageUrl,
		audioUrl,
		width = 720,
		height = 720
	} = $props<{
		imageUrl: string;
		audioUrl: string;
		width?: number;
		height?: number;
	}>();

	let canvas: HTMLCanvasElement;
	let audioElement: HTMLAudioElement;
	let gl: WebGLRenderingContext | null = null;
	let program: WebGLProgram | null = null;
	let texture: WebGLTexture | null = null;
	let albumImage: HTMLImageElement | null = null;

	// Trail effect framebuffers
	let trailTexture0: WebGLTexture | null = null;
	let trailTexture1: WebGLTexture | null = null;
	let trailFramebuffer0: WebGLFramebuffer | null = null;
	let trailFramebuffer1: WebGLFramebuffer | null = null;
	let currentTrailBuffer = 0;

	// Audio analysis
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let dataArray: Uint8Array | null = null;
	let animationId = 0;
	let source: MediaElementAudioSourceNode | null = null;

	// Animation state
	let time = 0;
	let rotation = 0;
	let smoothedBass = 0;

	// Random visual parameters - Video synth organic warm colors
	const colorSwatches = [
		{ hue: 320, sat: 95, light: 60 },  // Warm magenta
		{ hue: 35, sat: 100, light: 65 },  // Orange
		{ hue: 280, sat: 90, light: 58 },  // Purple
		{ hue: 180, sat: 85, light: 55 },  // Cyan
		{ hue: 60, sat: 95, light: 68 },   // Yellow
		{ hue: 150, sat: 80, light: 52 }   // Teal
	];
	const randomSwatch = colorSwatches[Math.floor(Math.random() * colorSwatches.length)];
	const trailHue = randomSwatch.hue;
	const distortionType = 4;  // Always use glitch distortion

	function hslToRgb(h: number, s: number, l: number): [number, number, number] {
		s /= 100;
		l /= 100;
		const k = (n: number) => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return [f(0), f(8), f(4)];
	}

	const trailColorRgb = hslToRgb(trailHue, 90, 60);

	onMount(async () => {
		// Load album artwork - no color replacement, use original colors
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.width = width;
		img.height = height;
		img.src = imageUrl;
		img.onload = () => {
			albumImage = img;
			setupWebGL();
		};
		img.onerror = (e) => {
			console.error('Failed to load album artwork', e);
		};
	});

	function setupWebGL() {
		if (!canvas || !albumImage) return;

		gl = canvas.getContext('webgl');
		if (!gl) {
			console.error('WebGL not supported');
			return;
		}

		const vertexShaderSource = `
			attribute vec2 a_position;
			attribute vec2 a_texCoord;
			varying vec2 v_texCoord;
			void main() {
				gl_Position = vec4(a_position, 0.0, 1.0);
				v_texCoord = a_texCoord;
			}
		`;

		const fragmentShaderSource = `
			precision mediump float;
			uniform sampler2D u_texture;
			uniform float u_scale;
			uniform float u_rotation;
			uniform float u_distortionAmount;
			uniform float u_time;
			uniform int u_distortionType;
			uniform float u_hueShift;
			uniform vec3 u_trailColor;
			uniform sampler2D u_trailTexture;
			uniform float u_trailDecay;
			uniform int u_renderMode;  // 0 = trails only (to framebuffer), 1 = final composite (to screen)
			varying vec2 v_texCoord;

			vec2 rotate(vec2 v, float a) {
				float s = sin(a);
				float c = cos(a);
				mat2 m = mat2(c, -s, s, c);
				return m * v;
			}

			vec3 rgb2hsv(vec3 c) {
				vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
				vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
				vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
				float d = q.x - min(q.w, q.y);
				float e = 1.0e-10;
				return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
			}

			vec3 hsv2rgb(vec3 c) {
				vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
				vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
				return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
			}

			void main() {
				vec2 center = vec2(0.5, 0.5);
				vec2 uv = v_texCoord;

				// Apply distortion
				if (u_distortionType == 0) {
					uv.x += sin(uv.y * 20.0 + u_time) * u_distortionAmount * 0.05;
				} else if (u_distortionType == 1) {
					uv.y += sin(uv.x * 20.0 + u_time) * u_distortionAmount * 0.05;
				} else if (u_distortionType == 2) {
					float dist = distance(uv, center);
					uv.x += sin(dist * 20.0 + u_time) * u_distortionAmount * 0.05;
				} else if (u_distortionType == 3) {
					uv.x += sin(uv.y * 15.0 + u_time) * u_distortionAmount * 0.05 * cos(u_time * 0.5);
				} else if (u_distortionType == 4) {
					// Glitch effect - more intense with multiple layers
					float glitchSeed = floor(u_time * 4.5);

					// Large blocks
					float block1 = step(0.5, sin(uv.y * 10.0 + glitchSeed * 13.7));
					float disp1 = (fract(sin(glitchSeed * 12.9898) * 43758.5453) - 0.5);
					uv.x += block1 * disp1 * u_distortionAmount * 0.35;

					// Medium blocks
					float block2 = step(0.6, sin(uv.y * 20.0 + glitchSeed * 7.3));
					float disp2 = (fract(sin(glitchSeed * 78.233) * 43758.5453) - 0.5);
					uv.x += block2 * disp2 * u_distortionAmount * 0.25;

					// Fine blocks
					float block3 = step(0.7, sin(uv.y * 35.0 + glitchSeed * 5.1));
					float disp3 = (fract(sin(glitchSeed * 45.164) * 43758.5453) - 0.5);
					uv.x += block3 * disp3 * u_distortionAmount * 0.15;
				}

				// Apply scale only (no rotation)
				vec2 scaled = (uv - center) / u_scale + center;

				// Check if scaled coords are out of bounds
				if (scaled.x < 0.0 || scaled.x > 1.0 || scaled.y < 0.0 || scaled.y > 1.0) {
					gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
					return;
				}

				// Sample texture - preserve original album artwork colors
				vec4 texColor = texture2D(u_texture, scaled);

				// VIDEO SYNTH: Multi-scale edge detection for richer organic edges
				float edgeOffset1 = 0.003;  // Fine detail
				float edgeOffset2 = 0.008;  // Medium structure

				// Fine detail edges
				vec3 blurred1 = vec3(0.0);
				blurred1 += texture2D(u_texture, scaled + vec2(-edgeOffset1, -edgeOffset1)).rgb * 0.077;
				blurred1 += texture2D(u_texture, scaled + vec2(0.0, -edgeOffset1)).rgb * 0.123;
				blurred1 += texture2D(u_texture, scaled + vec2(edgeOffset1, -edgeOffset1)).rgb * 0.077;
				blurred1 += texture2D(u_texture, scaled + vec2(-edgeOffset1, 0.0)).rgb * 0.123;
				blurred1 += texture2D(u_texture, scaled).rgb * 0.2;
				blurred1 += texture2D(u_texture, scaled + vec2(edgeOffset1, 0.0)).rgb * 0.123;
				blurred1 += texture2D(u_texture, scaled + vec2(-edgeOffset1, edgeOffset1)).rgb * 0.077;
				blurred1 += texture2D(u_texture, scaled + vec2(0.0, edgeOffset1)).rgb * 0.123;
				blurred1 += texture2D(u_texture, scaled + vec2(edgeOffset1, edgeOffset1)).rgb * 0.077;

				// Medium structure edges
				vec3 blurred2 = vec3(0.0);
				blurred2 += texture2D(u_texture, scaled + vec2(-edgeOffset2, -edgeOffset2)).rgb * 0.077;
				blurred2 += texture2D(u_texture, scaled + vec2(0.0, -edgeOffset2)).rgb * 0.123;
				blurred2 += texture2D(u_texture, scaled + vec2(edgeOffset2, -edgeOffset2)).rgb * 0.077;
				blurred2 += texture2D(u_texture, scaled + vec2(-edgeOffset2, 0.0)).rgb * 0.123;
				blurred2 += texture2D(u_texture, scaled).rgb * 0.2;
				blurred2 += texture2D(u_texture, scaled + vec2(edgeOffset2, 0.0)).rgb * 0.123;
				blurred2 += texture2D(u_texture, scaled + vec2(-edgeOffset2, edgeOffset2)).rgb * 0.077;
				blurred2 += texture2D(u_texture, scaled + vec2(0.0, edgeOffset2)).rgb * 0.123;
				blurred2 += texture2D(u_texture, scaled + vec2(edgeOffset2, edgeOffset2)).rgb * 0.077;

				// Combine multi-scale edges for organic video synth look - OUTLINED STYLE
				float edgeMag1 = length(texColor.rgb - blurred1);
				float edgeMag2 = length(texColor.rgb - blurred2);
				float edge1 = smoothstep(0.005, 0.08, edgeMag1);  // Sharper fine edges
				float edge2 = smoothstep(0.01, 0.15, edgeMag2);   // Sharper bold edges
				float edge = max(edge1 * 1.2, edge2 * 1.8);       // Much stronger edges for outlined look

				// Shift trail color hue
				vec3 trailColorHSV = rgb2hsv(u_trailColor);
				float colorHueShift = (u_hueShift / 360.0) * 1.0;
				trailColorHSV.x = fract(trailColorHSV.x + colorHueShift);
				// VIDEO SYNTH: Boost saturation for vibrant organic colors
				trailColorHSV.y = min(1.0, trailColorHSV.y * 1.5);
				vec3 shiftedTrailColor = hsv2rgb(trailColorHSV);

				// VIDEO SYNTH: Enhanced feedback trails with color bleeding
				vec4 previousTrail = texture2D(u_trailTexture, v_texCoord);

				// Color bleed: sample neighboring trail pixels for organic spread
				vec3 trailBleed = previousTrail.rgb;
				float bleedOffset = 0.002;
				trailBleed += texture2D(u_trailTexture, v_texCoord + vec2(bleedOffset, 0.0)).rgb * 0.15;
				trailBleed += texture2D(u_trailTexture, v_texCoord + vec2(-bleedOffset, 0.0)).rgb * 0.15;
				trailBleed += texture2D(u_trailTexture, v_texCoord + vec2(0.0, bleedOffset)).rgb * 0.15;
				trailBleed += texture2D(u_trailTexture, v_texCoord + vec2(0.0, -bleedOffset)).rgb * 0.15;
				trailBleed /= 1.6;  // Normalize

				vec3 decayedTrail = trailBleed * u_trailDecay;

				// Generate new trails based on brightness and color - REDUCED for outlined look
				float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
				vec3 coloredBrightness = texColor.rgb * brightness;
				// VIDEO SYNTH: Lighter trails - focus on edges instead
				vec3 newTrail = mix(shiftedTrailColor, coloredBrightness, 0.3) * brightness * 0.08;

				vec3 trails = decayedTrail + newTrail;

				// VIDEO SYNTH: Very bold colored edges for outlined look
				vec3 coloredEdge = shiftedTrailColor * edge * 1.5;

				// CRITICAL FIX: Separate trail buffer output from final screen output
				if (u_renderMode == 0) {
					// Render to trail buffer: ONLY trails and edges (no base image!)
					gl_FragColor = vec4(coloredEdge + trails, 1.0);
				} else {
					// Render to screen: base + trails + edges for outlined look
					// Keep more of the original image visible
					vec3 darkenedBase = texColor.rgb * 0.7;
					vec3 finalComposite = darkenedBase + coloredEdge + trails;

					// Replace bright/white areas with random red or green to prevent washing out
					float luminance = dot(finalComposite, vec3(0.299, 0.587, 0.114));
					if (luminance > 0.7) {
						float whiteness = (luminance - 0.7) / 0.3;

						// Random choice between red and green based on pixel position
						float randomSeed = fract(sin(dot(v_texCoord, vec2(12.9898, 78.233))) * 43758.5453);
						vec3 synthColor;
						if (randomSeed > 0.5) {
							synthColor = vec3(0.0, 1.0, 0.255);  // Green #00ff41
						} else {
							synthColor = vec3(1.0, 0.0, 0.0);    // Red
						}

						finalComposite = mix(finalComposite, synthColor, whiteness * 0.8);
					}

					gl_FragColor = vec4(finalComposite, 1.0);
				}
			}
		`;

		// Compile shaders
		const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
		gl.shaderSource(vertexShader, vertexShaderSource);
		gl.compileShader(vertexShader);
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
			return;
		}

		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
		gl.shaderSource(fragmentShader, fragmentShaderSource);
		gl.compileShader(fragmentShader);
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
			return;
		}

		// Create program
		program = gl.createProgram()!;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.useProgram(program);

		// Setup geometry
		const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
		const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

		const positionLocation = gl.getAttribLocation(program, 'a_position');
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		const texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

		const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
		gl.enableVertexAttribArray(texCoordLocation);
		gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		// Create texture from album image
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = width;
		tempCanvas.height = height;
		const tempCtx = tempCanvas.getContext('2d');
		if (tempCtx) {
			tempCtx.drawImage(albumImage, 0, 0, width, height);
		}

		texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Create trail framebuffers
		trailFramebuffer0 = gl.createFramebuffer();
		trailTexture0 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, trailTexture0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindFramebuffer(gl.FRAMEBUFFER, trailFramebuffer0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trailTexture0, 0);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		trailFramebuffer1 = gl.createFramebuffer();
		trailTexture1 = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, trailTexture1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.bindFramebuffer(gl.FRAMEBUFFER, trailFramebuffer1);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trailTexture1, 0);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	function setupAudio() {
		if (!audioElement) return;
		if (audioContext && source && analyser && dataArray) return;

		try {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8;

			const bufferLength = analyser.frequencyBinCount;
			dataArray = new Uint8Array(bufferLength);

			source = audioContext.createMediaElementSource(audioElement);
			source.connect(analyser);
			analyser.connect(audioContext.destination);
		} catch (error) {
			console.error('Audio setup error:', error);
		}
	}

	function analyzeFrequencyBands(data: Uint8Array): { bass: number; mid: number; high: number } {
		let bassSum = 0;
		let midSum = 0;
		let highSum = 0;

		for (let i = 0; i < 4; i++) bassSum += data[i];
		for (let i = 4; i < 16; i++) midSum += data[i];
		for (let i = 16; i < 64; i++) highSum += data[i];

		// Normalize and apply threshold - only react to strong bass
		let bassNormalized = bassSum / 4 / 255;
		let bass = bassNormalized > 0.7 ? Math.pow((bassNormalized - 0.7) / 0.3, 2.0) : 0;

		let mid = Math.pow(midSum / 12 / 255, 2.0);
		let high = Math.pow(highSum / 48 / 255, 2.0);

		return { bass, mid, high };
	}

	function draw(bass: number, mid: number, high: number) {
		if (!gl || !program) return;

		// Use raw bass, no smoothing
		const scale = 0.5 + bass * 0.5;
		const distortionAmount = Math.max(0, mid - 0.5) / 0.5 * 0.6;
		time += 0.02 + Math.max(0, mid - 0.5) / 0.5 * 0.2;
		rotation += high * 0.8;
		rotation = rotation % 360;
		const hueShift = high * 240;

		gl.useProgram(program);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

		gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
		gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), (rotation * Math.PI) / 180);
		gl.uniform1f(gl.getUniformLocation(program, 'u_distortionAmount'), distortionAmount);
		gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
		gl.uniform1i(gl.getUniformLocation(program, 'u_distortionType'), distortionType);
		gl.uniform3f(gl.getUniformLocation(program, 'u_trailColor'), trailColorRgb[0], trailColorRgb[1], trailColorRgb[2]);
		gl.uniform1f(gl.getUniformLocation(program, 'u_hueShift'), hueShift);
		gl.uniform1f(gl.getUniformLocation(program, 'u_trailDecay'), 0.88);  // Longer trail persistence for video synth feedback

		const readTexture = currentTrailBuffer === 0 ? trailTexture0 : trailTexture1;
		const writeFramebuffer = currentTrailBuffer === 0 ? trailFramebuffer1 : trailFramebuffer0;

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, readTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'u_trailTexture'), 1);

		// FIRST PASS: Render trails only to framebuffer (renderMode = 0)
		gl.uniform1i(gl.getUniformLocation(program, 'u_renderMode'), 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// SECOND PASS: Render final composite to screen (renderMode = 1)
		gl.uniform1i(gl.getUniformLocation(program, 'u_renderMode'), 1);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		currentTrailBuffer = 1 - currentTrailBuffer;
	}

	function animate() {
		if (!gl || !analyser || !dataArray) return;

		analyser.getByteFrequencyData(dataArray);
		const { bass, mid, high } = analyzeFrequencyBands(dataArray);
		draw(bass, mid, high);

		animationId = requestAnimationFrame(animate);
	}

	export async function play() {
		if (!audioElement) return;

		if (!audioContext) {
			setupAudio();
		}

		if (audioContext?.state === 'suspended') {
			await audioContext.resume();
		}

		// This will throw if autoplay is blocked
		await audioElement.play();

		if (animationId === 0 && analyser && dataArray && gl) {
			rotation = 0;
			animationId = requestAnimationFrame(animate);
		}
	}

	export function pause() {
		audioElement?.pause();
		if (animationId !== 0) {
			cancelAnimationFrame(animationId);
			animationId = 0;
		}
	}

	onDestroy(() => {
		if (animationId) cancelAnimationFrame(animationId);
		if (source) source.disconnect();
		if (analyser) analyser.disconnect();
		if (audioContext) audioContext.close();
		if (gl && texture) gl.deleteTexture(texture);
		if (gl && program) gl.deleteProgram(program);
	});
</script>

<div class="visualizer-container">
	<canvas bind:this={canvas} {width} {height}></canvas>
	<audio bind:this={audioElement} src={audioUrl} crossorigin="anonymous" />
</div>

<style>
	.visualizer-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	canvas {
		max-width: 100%;
		height: auto;
	}
</style>
