import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, platform }) => {
	console.log('Canvas API called', {
		hasPlatform: !!platform,
		hasEnv: !!platform?.env,
		hasCanvasRoom: !!platform?.env?.CANVAS_ROOM
	});

	// For local development, return a message
	if (!platform?.env?.CANVAS_ROOM) {
		return new Response(
			JSON.stringify({
				error: 'CANVAS_ROOM binding not available. Make sure the worker is deployed or running in a separate wrangler dev session.',
				dev: true,
				platform: {
					available: !!platform,
					envKeys: platform?.env ? Object.keys(platform.env) : []
				}
			}),
			{
				status: 503,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	try {
		// Get the Durable Object stub
		const id = platform.env.CANVAS_ROOM.idFromName('main-canvas');
		const stub = platform.env.CANVAS_ROOM.get(id);

		// Forward the request to the Durable Object
		return await stub.fetch(request);
	} catch (error) {
		console.error('Error forwarding to Durable Object:', error);
		return new Response(JSON.stringify({ error: String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
