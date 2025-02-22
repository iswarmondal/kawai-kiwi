<script lang="ts">
	import '../app.css';
	let { children } = $props();
	let loading = $state(false);
	import { userStore } from '$lib/stores/user.svelte';
	import { auth } from '$lib/firebase/init';
	import { goto } from '$app/navigation';
</script>

<div class="crt min-h-screen max-w-screen p-2 md:p-8 lg:p-12">
	<!-- Navbar -->
	<nav
		class="navbar bg-base-100/10 rounded-box border-neon-pink/30 top-2 right-2 left-2 z-50 border-2 bg-black/40 px-2 md:fixed md:top-4 md:right-4 md:left-4"
	>
		<div class="flex-1">
			<a
				href="/"
				class="btn btn-ghost text-neon-pink hover:text-neon-cyan hover-glow font-mono text-xl md:text-2xl"
			>
				KAWAI<span class="text-neon-green">KIWI</span>∆
			</a>
		</div>
		<div class="flex-none">
			{#if userStore.getUser()}
				<button
					onclick={() => {
						loading = true;
						auth.signOut().finally(() => {
							loading = false;
							goto('/login');
						});
					}}
					class="btn btn-primary bg-neon-purple/20 border-neon-purple hover:border-neon-cyan hover:bg-neon-cyan/20 text-neon-purple hover:text-neon-cyan hover-glow border-2"
				>
					{#if loading}
						<span class="loading loading-dots"></span>
					{:else}
						Logout
					{/if}
				</button>
			{:else}
				<a
					href="/login"
					class="btn btn-primary bg-neon-purple/20 border-neon-purple hover:border-neon-cyan hover:bg-neon-cyan/20 text-neon-purple hover:text-neon-cyan hover-glow border-2"
				>
					{#if loading}
						<span class="loading loading-dots"></span>
					{:else}
						Login / Start
					{/if}
				</a>
			{/if}
		</div>
	</nav>

	<!-- Main Content Area -->
	<main class="pt-4 md:pt-16">
		{@render children()}
	</main>

	<!-- Scanlines Overlay -->
	<div class="scanlines pointer-events-none fixed inset-0"></div>
</div>
