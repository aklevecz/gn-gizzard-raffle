<script lang="ts">
	import { enhance } from '$app/forms';
	import SongSelector from './SongSelector.svelte';
	import AlbumArtVisualizer from './AlbumArtVisualizer.svelte';
	import { onMount } from 'svelte';

	let { form, webglFailed = false } = $props<{ form: any; webglFailed?: boolean }>();
	let isSubmitting = $state(false);
	let visualizer: any = null;
	let isPlaying = $state(false);
	let playAttempted = $state(false);

	// Auto-play when form is successful and visualizer is ready
	$effect(() => {
		if (form?.success && form?.selectedSong && visualizer && !playAttempted) {
			// Small delay to ensure visualizer is fully mounted
			setTimeout(async () => {
				try {
					await visualizer.play();
					isPlaying = true;
					playAttempted = true;
				} catch (error) {
					// Autoplay was blocked - user needs to interact first
					console.log('Autoplay blocked, user interaction required');
					isPlaying = false;
					playAttempted = true;
				}
			}, 100);
		}
	});

	async function togglePlay() {
		if (!visualizer) return;

		if (isPlaying) {
			visualizer.pause();
			isPlaying = false;
		} else {
			try {
				await visualizer.play();
				isPlaying = true;
			} catch (error) {
				console.error('Failed to play:', error);
				isPlaying = false;
			}
		}
	}
</script>

<div class="raffle-form-container">
	<div class="form-header">
		<h2 class="form-title">Enter the Raffle</h2>
	</div>

	{#if form?.success && form?.selectedSong}
		<div class="success-container">
			<div class="success-message">
				<svg class="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p>{form.alreadyEntered ? 'You\'ve already entered! Good luck!' : 'Successfully entered! Good luck!'}</p>
			</div>

			{#if !webglFailed}
				<div class="visualizer-section">
					<div class="song-header">
						<div class="song-info">
							<h3 class="track-name">{form.selectedSong.trackName}</h3>
							<p class="album-name">{form.selectedSong.collectionName}</p>
						</div>
						<button class="play-button" onclick={togglePlay}>
							{isPlaying ? 'PAUSE' : 'PLAY'}
						</button>
					</div>

					<AlbumArtVisualizer
						bind:this={visualizer}
						imageUrl={form.selectedSong.artworkUrl100}
						audioUrl={form.selectedSong.previewUrl}
					/>
				</div>
			{/if}
		</div>
	{:else}
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
			class="raffle-form"
		>
			{#if form?.error}
				<div class="error-message">
					<p>{form.error}</p>
				</div>
			{/if}

			<div class="form-grid">
				<div class="form-group">
					<label for="fullName" class="form-label">
						Full Name <span class="required">*</span>
					</label>
					<input
						type="text"
						id="fullName"
						name="fullName"
						required
						class="form-input"
						placeholder="John Doe"
						value={form?.fullName ?? ''}
					/>
					{#if form?.errors?.fullName}
						<p class="field-error">{form.errors.fullName}</p>
					{/if}
				</div>

				<div class="form-group">
					<label for="email" class="form-label">
						Email <span class="required">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="form-input"
						placeholder="john@example.com"
						value={form?.email ?? ''}
					/>
					{#if form?.errors?.email}
						<p class="field-error">{form.errors.email}</p>
					{/if}
				</div>

				<div class="form-group">
					<label for="phone" class="form-label">
						Phone <span class="required">*</span>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						required
						class="form-input"
						placeholder="(555) 123-4567"
						value={form?.phone ?? ''}
					/>
					{#if form?.errors?.phone}
						<p class="field-error">{form.errors.phone}</p>
					{/if}
				</div>

				<div class="form-group full-width">
					<label for="song" class="form-label">
						Favorite King Gizzard Song <span class="required">*</span>
					</label>
					<SongSelector name="song" value={form?.song ?? ''} />
					{#if form?.errors?.song}
						<p class="field-error">{form.errors.song}</p>
					{/if}
				</div>
			</div>

			<button type="submit" disabled={isSubmitting} class="submit-button">
				{#if isSubmitting}
					<svg class="spinner" viewBox="0 0 24 24">
						<circle
							class="spinner-circle"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
					</svg>
					Submitting...
				{:else}
					Enter Raffle
				{/if}
			</button>
		</form>
	{/if}
</div>

<style>
	.raffle-form-container {
		width: 100%;
		max-width: 600px;
		margin: 0;
		padding: 2rem;
		background: transparent;
		border: none;
		box-shadow: none;
	}

	@media (max-width: 768px) {
		.raffle-form-container {
			padding: 1rem;
		}
	}

	.form-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.form-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #00ff41;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
	}

	.raffle-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.full-width {
		grid-column: 1 / -1;
	}

	.form-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: #00ff41;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
	}

	.required {
		color: #00ff41;
	}

	.form-input {
		padding: 0.75rem 1rem;
		background: #0a0a0a;
		border: 1px solid #00ff41;
		color: #ffffff;
		font-size: 16px;
		transition: all 0.3s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #00ff41;
		background: #1a1a1a;
		box-shadow: 0 0 0 1px #00ff41;
	}

	.form-input::placeholder {
		color: #00ff41;
		opacity: 0.7;
	}

	textarea.form-input {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.field-error {
		color: #00ff41;
		font-size: 0.875rem;
		margin-top: 0.25rem;
		font-weight: 600;
		font-family: 'Oswald', sans-serif;
		text-transform: uppercase;
		letter-spacing: normal;
	}

	.submit-button {
		padding: 1rem 2rem;
		background: #00ff41;
		color: #000000;
		font-weight: 700;
		font-size: 1rem;
		border: 2px solid #00ff41;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
		margin-top: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background: #000000;
		color: #00ff41;
		border-color: #00ff41;
		transform: scale(1.02);
		box-shadow: 0 6px 20px rgba(0, 255, 65, 0.5);
	}

	.submit-button:active:not(:disabled) {
		transform: scale(0.98);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.success-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.success-message {
		padding: 1.5rem;
		background: #0a0a0a;
		border: 2px solid #00ff41;
		color: #00ff41;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-weight: 600;
		font-family: 'Oswald', sans-serif;
		text-transform: uppercase;
		letter-spacing: normal;
	}

	.success-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #00ff41;
		flex-shrink: 0;
	}

	.visualizer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.song-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		width: 100%;
	}

	.song-info {
		text-align: left;
		flex: 1;
	}

	.track-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: #00ff41;
		text-transform: uppercase;
		font-family: 'Oswald', sans-serif;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
	}

	.album-name {
		font-size: 0.875rem;
		color: #00ff41;
		opacity: 0.7;
		margin: 0;
	}

	.play-button {
		padding: 0.75rem 1.5rem;
		background: #00ff41;
		color: #000000;
		font-weight: 700;
		font-size: 0.875rem;
		border: 2px solid #00ff41;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: 'Oswald', sans-serif;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.play-button:hover {
		background: #000000;
		color: #00ff41;
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 255, 65, 0.5);
	}

	.play-button:active {
		transform: scale(0.98);
	}

	.error-message {
		padding: 1.5rem;
		background: #00ff41;
		border: 2px solid #00ff41;
		color: #000000;
		font-weight: 600;
		font-family: 'Oswald', sans-serif;
		text-transform: uppercase;
		letter-spacing: normal;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	.spinner-circle {
		fill: none;
		stroke-dasharray: 40;
		stroke-dashoffset: 10;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.raffle-form-container {
			padding: 1.5rem;
		}

		.form-title {
			font-size: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.submit-button {
			font-size: 1rem;
		}
	}
</style>
