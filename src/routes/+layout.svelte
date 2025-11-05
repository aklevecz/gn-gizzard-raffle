<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/jpeg" href="/rat_smoller.jpg" />
</svelte:head>

{@render children()}
