import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import songsData from '$lib/kglw_songs.json';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	// Check if user has already entered via cookie
	const entryId = cookies.get('raffle_entry');

	if (entryId && platform?.env?.RAFFLE_ENTRIES) {
		try {
			const existingEntry = await platform.env.RAFFLE_ENTRIES.get(entryId);
			if (existingEntry) {
				const entry = JSON.parse(existingEntry);
				const selectedSong = songsData.results.find((s: any) => s.trackId.toString() === entry.song);
				return {
					alreadyEntered: true,
					selectedSong
				};
			}
		} catch (error) {
			console.error('Error checking existing entry:', error);
		}
	}

	return {};
};

export const actions = {
	default: async ({ request, platform, cookies }) => {
		const formData = await request.formData();
		const fullName = formData.get('fullName')?.toString();
		const email = formData.get('email')?.toString();
		const phone = formData.get('phone')?.toString();
		const song = formData.get('song')?.toString();
		const additionalInfo = formData.get('additionalInfo')?.toString();

		const errors: Record<string, string> = {};

		// Validation
		if (!fullName || fullName.trim().length < 2) {
			errors.fullName = 'Please enter a valid full name';
		}

		if (!email || !isValidEmail(email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!phone || phone.trim().length < 10) {
			errors.phone = 'Please enter a valid phone number';
		}

		if (!song || song.trim().length === 0) {
			errors.song = 'Please select your favorite King Gizzard song';
		}

		// If there are validation errors, return them
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				fullName,
				email,
				phone,
				song,
				additionalInfo
			});
		}

		// Check if email already exists in KV
		try {
			if (platform?.env?.RAFFLE_ENTRIES && email) {
				const existingEntry = await platform.env.RAFFLE_ENTRIES.get(`email:${email}`);
				if (existingEntry) {
					const entry = JSON.parse(existingEntry);
					const selectedSong = songsData.results.find((s: any) => s.trackId.toString() === entry.song);

					// Set cookie for this browser
					cookies.set('raffle_entry', entry.id, {
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'lax',
						maxAge: 60 * 60 * 24 * 365 // 1 year
					});

					return {
						success: true,
						alreadyEntered: true,
						selectedSong
					};
				}
			}
		} catch (error) {
			console.error('Error checking existing entry:', error);
		}

		// Get selected song from bundled data
		const selectedSong = songsData.results.find((s: any) => s.trackId.toString() === song);

		// Save to Cloudflare KV
		const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const entry = {
			id: entryId,
			fullName,
			email,
			phone,
			song,
			songName: selectedSong?.trackName,
			albumName: selectedSong?.collectionName,
			additionalInfo,
			timestamp: new Date().toISOString()
		};

		// Debug logging
		console.log('Platform object:', !!platform);
		console.log('Platform env:', !!platform?.env);
		console.log('RAFFLE_ENTRIES binding:', !!platform?.env?.RAFFLE_ENTRIES);

		// Save to KV with email as key for easy lookup
		try {
			if (platform?.env?.RAFFLE_ENTRIES) {
				await platform.env.RAFFLE_ENTRIES.put(
					`email:${email}`,
					JSON.stringify(entry)
				);

				// Also save with entry ID for listing
				await platform.env.RAFFLE_ENTRIES.put(
					entryId,
					JSON.stringify(entry)
				);

				console.log('Raffle entry saved to KV:', entry);
			} else {
				// Fallback for local development
				console.log('KV not available, entry not saved. Platform:', platform, 'Entry:', entry);
			}

			// Set cookie for this browser
			cookies.set('raffle_entry', entryId, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365 // 1 year
			});
		} catch (error) {
			console.error('Error saving to KV:', error);
			// Don't fail the request, just log the error
		}

		return {
			success: true,
			selectedSong
		};
	}
} satisfies Actions;

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
