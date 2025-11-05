<script lang="ts">
	import VinylCube from '$lib/components/VinylCube.svelte';
	import RaffleForm from '$lib/components/RaffleForm.svelte';
	import DrawableCanvas from '$lib/components/DrawableCanvas.svelte';
	import { deviceType } from '$lib/stores/device';

	let { data, form } = $props();
	let showVideo = $state(false);
	let webglFailed = $state(false);

	// Merge load data with form data - prioritize form data if available
	const effectiveForm = $derived(form || (data.alreadyEntered ? { success: true, alreadyEntered: true, selectedSong: data.selectedSong } : null));

	function handleSeeVisual() {
		// Toggle video on both mobile and desktop
		showVideo = !showVideo;
	}

	function handleWebGLStatusChange(failed: boolean) {
		webglFailed = failed;
	}
</script>

<svelte:head>
	<title>rPETro Dragonic Apocalypse - Limited Edition Raffle</title>
	<meta name="description" content="Enter for your chance to purchase one of the remaining 70 copies of the world's first EcoSonic Record created from 100% recycled plastic (rPET). King Gizzard & The Lizard Wizard's PetroDragonic Apocalypse, made by Good Neighbor." />

	<!-- Favicon -->
	<link rel="icon" type="image/jpeg" href="/rat_smoller.jpg" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="rPETro Dragonic Apocalypse - Limited Edition Raffle" />
	<meta property="og:description" content="Enter for your chance to purchase one of the remaining 70 copies of the world's first EcoSonic Record created from 100% recycled plastic (rPET)." />
	<meta property="og:image" content="/lizard_cover_1024.jpg" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="rPETro Dragonic Apocalypse - Limited Edition Raffle" />
	<meta name="twitter:description" content="Enter for your chance to purchase one of the remaining 70 copies of the world's first EcoSonic Record created from 100% recycled plastic (rPET)." />
	<meta name="twitter:image" content="/lizard_cover_1024.jpg" />
</svelte:head>

<!-- <DrawableCanvas /> -->

<!-- Characters peering around -->
<img
	src="/characters/hifive-blackwhite.svg"
	alt=""
	class="character character-hifive"
	aria-hidden="true"
/>
<img
	src="/characters/juggle-blackwhite.svg"
	alt=""
	class="character character-juggle"
	aria-hidden="true"
/>
<img
	src="/characters/spin-blackwhite.svg"
	alt=""
	class="character character-spin"
	aria-hidden="true"
/>
<img
	src="/characters/carry-blackwhite.svg"
	alt=""
	class="character character-carry"
	aria-hidden="true"
/>
<img
	src="/characters/welcome-blackwhite.svg"
	alt=""
	class="character character-welcome"
	aria-hidden="true"
/>
<img
	src="/characters/infatuation-blackwhite.svg"
	alt=""
	class="character character-infatuation"
	aria-hidden="true"
/>

<div class="page-container">
	<header class="header">
		<h1 class="main-title">rPETro Dragonic Apocalypse</h1>
		<h2 class="sub-title">70 Copies Remain</h2>
	</header>

	<main class="main-content">
		<section class="cube-section">
			<VinylCube {showVideo} onWebGLStatusChange={handleWebGLStatusChange} />
			<button class="see-visual-button" onclick={handleSeeVisual}>
				{#if showVideo}
					BACK TO IMAGE
				{:else}
					SEE VISUAL
				{/if}
			</button>
			<div class="description">
				<p class="description-text">
					This record was made by <span class="highlight">Good Neighbor</span> and is the world's
					first vinyl record created from <span class="highlight">100% recycled plastic (rPET)</span
					>.
				</p>
				<p class="description-text">
					Enter this raffle for your chance to purchase one of the remaining
					<span class="highlight">70 copies</span>.
				</p>
			</div>
		</section>

		<section class="form-section">
			<RaffleForm form={effectiveForm} {webglFailed} />
		</section> 
	</main>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #0a0a0a;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
	}

	.header {
		text-align: center;
		padding: 2rem 1rem 1rem;
		background: transparent;
	}

	.main-title {
		font-size: clamp(1.5rem, 5vw, 2.5rem);
		font-weight: 700;
		color: #00ff41;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
		margin: 0;
	}
	
	.sub-title {
		font-size: 1.25rem;
		margin: 0.5rem 0 0;
		font-weight: 700;
		text-transform: uppercase;
	}

	.description {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 500px;
		text-align: left;
		pointer-events: none;
		user-select: none;
	}

	.description-text {
		color: #00ff41;
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
		font-weight: 700;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
	}

	.highlight {
		color: #00ff41;
		font-weight: 700;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: row;
		gap: 3rem;
		padding: 3rem 2rem;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
		align-items: center;
	}

	.cube-section {
		flex: 1.2;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
		touch-action: pan-y;
		position: relative;
		z-index: 3;
	}

	.form-section {
		flex: 0.8;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.see-visual-button {
		padding: 0.875rem 2rem;
		background: #000000;
		color: #00ff41;
		font-weight: 700;
		font-size: 0.875rem;
		border: 2px solid #00ff41;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		touch-action: manipulation;
	}

	.see-visual-button:hover {
		background: #00ff41;
		color: #000000;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 255, 65, 0.5);
	}

	.see-visual-button:active {
		transform: scale(0.98);
	}

	.form-section {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media (max-width: 1024px) {
		.header {
			padding: 1.5rem 1rem;
		}

		.main-content {
			flex-direction: column;
			gap: 2rem;
			padding: 2rem 1rem;
		}

		.cube-section {
			flex: none;
			width: 100%;
		}

		.form-section {
			flex: none;
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.main-title {
			font-size: 1.5rem;
		}
	}

	/* Characters peering around */
	.character {
		position: absolute;
		z-index: 2;
		pointer-events: none;
		opacity: 0.6;
		filter: brightness(0) invert(1);
	}

	.character-hifive {
		left: -80px;
		top: 15%;
		width: 160px;
		height: auto;
		transform: rotate(-15deg);
		animation: float 6s ease-in-out infinite;
	}

	.character-juggle {
		right: -60px;
		top: 35%;
		width: 140px;
		height: auto;
		transform: rotate(10deg) scaleX(-1);
		animation: float 5s ease-in-out infinite;
		animation-delay: 0.5s;
	}

	.character-spin {
		bottom: -60px;
		left: 10%;
		width: 130px;
		height: auto;
		transform: rotate(-8deg);
		animation: float 7s ease-in-out infinite;
		animation-delay: 1s;
	}

	.character-carry {
		left: -70px;
		bottom: 20%;
		width: 150px;
		height: auto;
		transform: rotate(12deg);
		animation: float 5.5s ease-in-out infinite;
		animation-delay: 1.5s;
	}

	.character-welcome {
		right: -50px;
		top: 5%;
		width: 120px;
		height: auto;
		transform: rotate(-10deg) scaleX(-1);
		animation: float 6.5s ease-in-out infinite;
		animation-delay: 2s;
	}

	.character-infatuation {
		right: -40px;
		bottom: 15%;
		width: 125px;
		height: auto;
		transform: rotate(15deg);
		animation: float 6s ease-in-out infinite;
		animation-delay: 2.5s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-15px);
		}
	}

	@media (max-width: 1024px) {
		.character-hifive {
			width: 180px;
			left: -60px;
		}

		.character-juggle {
			width: 160px;
			right: -40px;
		}

		.character-spin {
			width: 150px;
			bottom: -40px;
		}

		.character-carry {
			width: 170px;
			left: -50px;
		}

		.character-welcome {
			width: 140px;
			right: -30px;
		}

		.character-infatuation {
			width: 150px;
			right: -30px;
		}
	}

	@media (max-width: 480px) {
		.character {
			opacity: 0.4;
		}

		.character-hifive {
			width: 120px;
			left: -40px;
		}

		.character-juggle {
			width: 110px;
			right: -30px;
		}

		.character-spin {
			width: 100px;
			bottom: -30px;
		}

		.character-carry {
			width: 110px;
			left: -35px;
		}

		.character-welcome {
			width: 90px;
			right: -25px;
		}

		.character-infatuation {
			width: 100px;
			right: -25px;
		}
	}
</style>
