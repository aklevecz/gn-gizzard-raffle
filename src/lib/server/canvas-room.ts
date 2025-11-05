// Cloudflare Durable Object for collaborative canvas
export class CanvasRoom {
	state: DurableObjectState;
	sessions: Set<WebSocket>;

	constructor(state: DurableObjectState) {
		this.state = state;
		this.sessions = new Set();
	}

	async fetch(request: Request): Promise<Response> {
		// Handle WebSocket upgrade
		if (request.headers.get('Upgrade') === 'websocket') {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			// Accept the WebSocket connection
			this.handleSession(server);

			return new Response(null, {
				status: 101,
				webSocket: client
			});
		}

		return new Response('Expected WebSocket', { status: 400 });
	}

	handleSession(webSocket: WebSocket) {
		webSocket.accept();
		this.sessions.add(webSocket);

		webSocket.addEventListener('message', (event) => {
			try {
				// Broadcast drawing data to all other clients
				const message = event.data;
				this.broadcast(message, webSocket);
			} catch (err) {
				console.error('Error handling message:', err);
			}
		});

		webSocket.addEventListener('close', () => {
			this.sessions.delete(webSocket);
		});

		webSocket.addEventListener('error', () => {
			this.sessions.delete(webSocket);
		});
	}

	broadcast(message: string | ArrayBuffer, sender: WebSocket) {
		// Send to all clients except the sender
		for (const session of this.sessions) {
			if (session !== sender && session.readyState === 1) {
				// 1 = OPEN
				session.send(message);
			}
		}
	}
}
