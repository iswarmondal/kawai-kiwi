<script lang="ts">
	import { browser } from '$app/environment';
	import { userStore } from '$lib/stores/user.svelte';

	let { data } = $props();

	// Additional protection in the component
	$effect(() => {
		if (browser && !userStore.isLoading() && !userStore.getUser()) {
			window.location.href = '/login';
		}
	});
</script>

{#if data.loading}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="space-y-4 text-center">
			<span class="loading loading-dots loading-lg text-neon-cyan"></span>
			<p class="text-neon-cyan/80 animate-pulse font-mono">ESTABLISHING_SECURE_CONNECTION...</p>
		</div>
	</div>
{:else}
	<div class="space-y-8">
		<div class="text-center">
			<h1 class="glitch text-neon-green text-4xl font-bold md:text-5xl" data-text="SECURE_CHAT">
				SECURE_CHAT
			</h1>
			<p class="text-neon-cyan/80 mt-4 font-mono">
				Connected as: {data.user?.email}
				<br />
				<em class="text-neon-cyan/80 text-xs">Do not worry your email is private 🤐</em>
			</p>
		</div>

		<!-- Chat interface will go here -->
		<div
			class="card bg-base-100/10 border-neon-cyan/20 min-h-[60vh] rounded-xl border-2 p-8 backdrop-blur-sm"
		>
			<p class="text-neon-cyan/80 text-center font-mono">
				[System]: Chat interface under construction...
			</p>
		</div>
	</div>
{/if}
