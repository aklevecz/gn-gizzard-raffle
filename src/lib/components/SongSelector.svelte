<script lang="ts">
	import { onMount } from 'svelte';

	let { value = '', name = 'song' } = $props<{ value?: string; name?: string }>();

	type Song = {
		trackId: number;
		trackName: string;
		collectionName: string;
		releaseDate: string;
		artworkUrl100: string;
	};

	let songs: Song[] = $state([]);
	let isOpen = $state(false);
	let searchQuery = $state('');
	let selectedSong: Song | null = $state(null);
	let filteredSongs = $derived(
		songs.filter(
			(song) =>
				(song.trackName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
				(song.collectionName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
		)
	);

	onMount(async () => {
		const response = await fetch('/kglw_songs.json');
		const data = await response.json();
		songs = data.results;

		// Set initial selected song if value is provided
		if (value) {
			selectedSong = songs.find((s) => s.trackId.toString() === value) || null;
		}
	});

	function selectSong(song: Song) {
		selectedSong = song;
		isOpen = false;
		searchQuery = '';
	}

	function toggleDropdown(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		isOpen = !isOpen;
	}

	function handleClickOutside(event: Event) {
		const target = event.target as HTMLElement;
		if (!target.closest('.song-selector')) {
			isOpen = false;
		}
	}

	function handleSearchClick(event: Event) {
		event.stopPropagation();
	}

	onMount(() => {
		// Use mousedown instead of click for better mobile compatibility
		const handleOutsideInteraction = (e: Event) => {
			// Small delay to allow other handlers to run first
			setTimeout(() => handleClickOutside(e), 10);
		};

		document.addEventListener('mousedown', handleOutsideInteraction);
		document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });

		return () => {
			document.removeEventListener('mousedown', handleOutsideInteraction);
			document.removeEventListener('touchstart', handleOutsideInteraction);
		};
	});
</script>

<div class="song-selector">
	<input type="hidden" {name} value={selectedSong?.trackId || ''} />

	<button type="button" class="selector-button" onclick={toggleDropdown}>
		{#if selectedSong}
			<div class="selected-song">
				<img src={selectedSong.artworkUrl100} alt={selectedSong.trackName} class="album-art" />
				<div class="song-info">
					<div class="track-name">{selectedSong.trackName}</div>
					<div class="album-name">{selectedSong.collectionName}</div>
				</div>
			</div>
		{:else}
			<span class="placeholder">Select your favorite King Gizzard song</span>
		{/if}
		<svg
			class="chevron"
			class:open={isOpen}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop overlay for all screen sizes -->
		<div class="backdrop" onclick={toggleDropdown}></div>

		<div class="dropdown">
			<div class="dropdown-header">
				<div class="header-content">
					<h3 class="dropdown-title">Choose Your Favorite Song</h3>
					<p class="dropdown-subtitle">Search through King Gizzard's discography</p>
				</div>
				<button type="button" class="close-button" onclick={toggleDropdown}>
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<input
				type="text"
				class="search-input"
				placeholder="Search songs or albums..."
				bind:value={searchQuery}
				onclick={handleSearchClick}
				ontouchstart={handleSearchClick}
			/>

			<div class="song-list">
				{#if filteredSongs.length === 0}
					<div class="no-results">
						<p>No songs found</p>
					</div>
				{:else}
					{#each filteredSongs as song (song.trackId)}
						<button
							type="button"
							class="song-item"
							class:selected={selectedSong?.trackId === song.trackId}
							onclick={() => selectSong(song)}
						>
							<img src={song.artworkUrl100} alt={song.trackName} class="album-art-small" />
							<div class="song-details">
								<div class="track-name-small">{song.trackName}</div>
								<div class="album-name-small">{song.collectionName}</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.song-selector {
		position: relative;
		width: 100%;
	}

	.selector-button {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #0a0a0a;
		border: 1px solid #00ff41;
		color: #00ff41;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		transition: all 0.3s ease;
		text-align: left;
	}

	.selector-button:hover {
		background: #1a1a1a;
		box-shadow: 0 0 0 1px #00ff41;
	}

	.placeholder {
		opacity: 0.7;
		font-size: 0.875rem;
	}

	.selected-song {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.album-art {
		width: 40px;
		height: 40px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.song-info {
		flex: 1;
		min-width: 0;
	}

	.track-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: #00ff41;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
	}

	.album-name {
		font-size: 0.75rem;
		color: #00ff41;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chevron {
		width: 1.25rem;
		height: 1.25rem;
		color: #00ff41;
		transition: transform 0.3s ease;
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.backdrop {
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 999;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.dropdown {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #0a0a0a;
		border: 2px solid #00ff41;
		z-index: 1000;
		max-height: 80vh;
		width: 90%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 255, 65, 0.3);
		animation: scaleIn 0.3s ease;
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@media (max-width: 768px) {
		.dropdown {
			position: fixed;
			top: auto;
			left: 0;
			right: 0;
			bottom: 0;
			transform: none;
			max-height: 80vh;
			width: 100%;
			max-width: none;
			border: 2px solid #00ff41;
			border-bottom: none;
			border-radius: 20px 20px 0 0;
			animation: slideUp 0.3s ease;
			box-shadow: 0 -10px 40px rgba(0, 255, 65, 0.3);
		}

		@keyframes slideUp {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 1px solid #00ff41;
		gap: 1rem;
	}

	.header-content {
		flex: 1;
	}

	.dropdown-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #00ff41;
		margin: 0 0 0.25rem 0;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
	}

	.dropdown-subtitle {
		font-size: 0.875rem;
		color: #00ff41;
		opacity: 0.7;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		color: #00ff41;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.close-button svg {
		width: 24px;
		height: 24px;
	}

	.close-button:active {
		transform: scale(0.95);
	}

	.search-input {
		padding: 0.75rem 1rem;
		background: #0a0a0a;
		border: none;
		border-bottom: 1px solid #00ff41;
		color: #00ff41;
		font-size: 16px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		touch-action: manipulation;
		user-select: text;
		-webkit-user-select: text;
	}

	.search-input::placeholder {
		color: #00ff41;
		opacity: 0.7;
	}

	.song-list {
		overflow-y: auto;
		max-height: 350px;
		min-height: 350px;
	}

	@media (max-width: 768px) {
		.song-list {
			max-height: calc(80vh - 180px);
			min-height: auto;
		}
	}

	.song-list::-webkit-scrollbar {
		width: 8px;
	}

	.song-list::-webkit-scrollbar-track {
		background: #0a0a0a;
	}

	.song-list::-webkit-scrollbar-thumb {
		background-color: #00ff41;
		border-radius: 4px;
	}

	.song-item {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #0a0a0a;
		border: none;
		border-bottom: 1px solid rgba(0, 255, 65, 0.2);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: background 0.2s ease;
		text-align: left;
	}

	.song-item:hover {
		background: #1a1a1a;
	}

	.song-item.selected {
		background: rgba(0, 255, 65, 0.1);
	}

	.album-art-small {
		width: 50px;
		height: 50px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.song-details {
		flex: 1;
		min-width: 0;
	}

	.track-name-small {
		font-size: 0.875rem;
		font-weight: 700;
		color: #00ff41;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
	}

	.album-name-small {
		font-size: 0.75rem;
		color: #00ff41;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.25rem;
	}

	.no-results {
		padding: 2rem 1rem;
		text-align: center;
		color: #00ff41;
		opacity: 0.7;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 350px;
	}

	@media (max-width: 768px) {
		.no-results {
			min-height: calc(80vh - 180px);
		}
	}

	.no-results p {
		margin: 0;
		font-size: 0.875rem;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
	}
</style>
