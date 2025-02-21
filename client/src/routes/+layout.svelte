<script lang="ts">
	import '../app.css';
	let { children } = $props();
	let loading = $state(false);
	import { userStore } from '$lib/stores/user.svelte';
	import { auth } from '$lib/firebase/init';
	import { goto } from '$app/navigation';
</script>

<div class="crt min-h-screen p-4 md:p-8 lg:p-12">
	<!-- Navbar -->
	<nav
		class="navbar bg-base-100/10 rounded-box border-neon-pink/30 fixed top-4 right-4 left-4 z-50 mb-12 border-2 px-4 backdrop-blur-lg"
	>
		<div class="flex-1">
			<a
				href="/"
				class="btn btn-ghost text-neon-pink hover:text-neon-cyan hover-glow font-mono text-2xl"
			>
				VID<span class="text-neon-green">CHAT</span>∆
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
	<main class="pt-24">
		{@render children()}
	</main>

	<!-- Scanlines Overlay -->
	<div class="scanlines pointer-events-none fixed inset-0"></div>
</div>
