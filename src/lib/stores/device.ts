import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type DeviceType = 'mobile' | 'desktop';

function createDeviceStore() {
	const { subscribe, set } = writable<DeviceType>('desktop');

	if (browser) {
		const checkDevice = () => {
			const isMobile = window.innerWidth < 768 ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			set(isMobile ? 'mobile' : 'desktop');
		};

		// Check on initialization
		checkDevice();

		// Listen for resize events
		window.addEventListener('resize', checkDevice);
	}

	return {
		subscribe
	};
}

export const deviceType = createDeviceStore();

// Helper function to check if mobile
export function isMobile(): boolean {
	if (!browser) return false;
	return window.innerWidth < 768 ||
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper function to check if desktop
export function isDesktop(): boolean {
	return !isMobile();
}
