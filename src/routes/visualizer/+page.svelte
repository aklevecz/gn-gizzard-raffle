<script lang="ts">
	import { onMount } from 'svelte';
	import AlbumArtVisualizer from '$lib/components/AlbumArtVisualizer.svelte';

	type Song = {
		trackId: number;
		trackName: string;
		collectionName: string;
		artworkUrl100: string;
		previewUrl: string;
	};

	let songs: Song[] = $state([]);
	let selectedSong: Song | null = $state(null);
	let visualizer: any = null;
	let isPlaying = $state(false);

	onMount(async () => {
		const response = await fetch('/kglw_songs.json');
		const data = await response.json();
		songs = data.results;

		// Select random song
		if (songs.length > 0) {
			selectedSong = songs[Math.floor(Math.random() * songs.length)];
		}
	});

	function togglePlay() {
		if (!visualizer) return;

		if (isPlaying) {
			visualizer.pause();
			isPlaying = false;
		} else {
			visualizer.play();
			isPlaying = true;
		}
	}

	function selectRandomSong() {
		if (songs.length > 0) {
			isPlaying = false;
			visualizer?.pause();
			selectedSong = songs[Math.floor(Math.random() * songs.length)];
		}
	}
</script>

<svelte:head>
	<title>Gizzard Visualizer</title>
	<meta name="description" content="King Gizzard audio visualizer" />
</svelte:head>

<div class="page-container">
	<header class="header">
		<h1 class="title">Gizzard Visualizer</h1>
	</header>

	<main class="main-content">
		{#if selectedSong}
			<div class="visualizer-section">
				<AlbumArtVisualizer
					bind:this={visualizer}
					imageUrl={selectedSong.artworkUrl100}
					audioUrl={selectedSong.previewUrl}
				/>

				<div class="song-info">
					<h2 class="track-name">{selectedSong.trackName}</h2>
					<p class="album-name">{selectedSong.collectionName}</p>
				</div>

				<div class="controls">
					<button class="control-button" onclick={togglePlay}>
						{isPlaying ? 'PAUSE' : 'PLAY'}
					</button>
					<button class="control-button" onclick={selectRandomSong}> RANDOM SONG </button>
				</div>
			</div>
		{:else}
			<div class="loading">Loading songs...</div>
		{/if}
	</main>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #0a0a0a;
		display: flex;
		flex-direction: column;
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.title {
		font-size: clamp(2rem, 6vw, 3rem);
		font-weight: 700;
		color: #00ff41;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
		margin: 0;
	}

	.main-content {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.visualizer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		max-width: 900px;
		width: 100%;
	}

	.song-info {
		text-align: center;
	}

	.track-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: #00ff41;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
	}

	.album-name {
		font-size: 1rem;
		color: #00ff41;
		opacity: 0.7;
		margin: 0;
	}

	.controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.control-button {
		padding: 1rem 2rem;
		background: #00ff41;
		color: #000000;
		font-weight: 700;
		font-size: 1rem;
		border: 2px solid #00ff41;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
	}

	.control-button:hover {
		background: #000000;
		color: #00ff41;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 255, 65, 0.5);
	}

	.control-button:active {
		transform: scale(0.98);
	}

	.loading {
		color: #00ff41;
		font-size: 1.5rem;
		font-family: 'Oswald', sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.title {
			font-size: 2rem;
		}

		.track-name {
			font-size: 1.25rem;
		}

		.control-button {
			padding: 0.875rem 1.5rem;
			font-size: 0.875rem;
		}
	}
</style>
