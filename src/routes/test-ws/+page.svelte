<script lang="ts">
	let ws: WebSocket | null = $state(null);
	let connected = $state(false);
	let messages: string[] = $state([]);
	let status = $state('Not connected');

	function connect() {
		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${window.location.host}/api/canvas`;

			status = `Connecting to ${wsUrl}...`;
			ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				connected = true;
				status = 'Connected!';
				messages = [...messages, 'WebSocket connection opened'];
			};

			ws.onmessage = (event) => {
				messages = [...messages, `Received: ${event.data}`];
			};

			ws.onerror = (error) => {
				status = 'Error occurred';
				messages = [...messages, `Error: ${error}`];
			};

			ws.onclose = () => {
				connected = false;
				status = 'Disconnected';
				messages = [...messages, 'WebSocket connection closed'];
			};
		} catch (error) {
			status = `Exception: ${error}`;
			messages = [...messages, `Exception: ${error}`];
		}
	}

	function sendTest() {
		if (ws && ws.readyState === WebSocket.OPEN) {
			const testData = JSON.stringify({ x1: 100, y1: 100, x2: 200, y2: 200 });
			ws.send(testData);
			messages = [...messages, `Sent: ${testData}`];
		} else {
			messages = [...messages, 'Cannot send - WebSocket not open'];
		}
	}

	function disconnect() {
		if (ws) {
			ws.close();
		}
	}
</script>

<div style="padding: 2rem; font-family: monospace;">
	<h1 style="font-size: 2rem; margin-bottom: 1rem;">WebSocket Connection Test</h1>

	<div style="margin-bottom: 1rem;">
		<strong>Status:</strong> {status}
	</div>

	<div style="margin-bottom: 1rem;">
		<button
			onclick={connect}
			disabled={connected}
			style="padding: 0.5rem 1rem; margin-right: 0.5rem; background: {connected ? '#ccc' : '#00f'}; color: white; border: none; cursor: {connected ? 'not-allowed' : 'pointer'};"
		>
			Connect
		</button>
		<button
			onclick={sendTest}
			disabled={!connected}
			style="padding: 0.5rem 1rem; margin-right: 0.5rem; background: {!connected ? '#ccc' : '#0a0'}; color: white; border: none; cursor: {!connected ? 'not-allowed' : 'pointer'};"
		>
			Send Test Message
		</button>
		<button
			onclick={disconnect}
			disabled={!connected}
			style="padding: 0.5rem 1rem; background: {!connected ? '#ccc' : '#f00'}; color: white; border: none; cursor: {!connected ? 'not-allowed' : 'pointer'};"
		>
			Disconnect
		</button>
	</div>

	<div style="margin-top: 2rem;">
		<h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Messages Log:</h2>
		<div style="background: #000; color: #0f0; padding: 1rem; max-height: 400px; overflow-y: auto; font-size: 0.875rem;">
			{#each messages as message, i}
				<div>{i + 1}. {message}</div>
			{/each}
		</div>
	</div>
</div>
