<script lang="ts">
	import { browser } from '$app/environment';
	import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
	import { auth } from '$lib/firebase/init';
	import { userStore } from '$lib/stores/user.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let loading = $state(false);

	// Redirect if user is already logged in
	onMount(() => {
		if (browser && userStore.getUser() && !userStore.isLoading()) {
			goto('/chat');
		}
	});

	// Watch for auth state changes
	$effect(() => {
		if (browser && userStore.getUser() && !userStore.isLoading()) {
			goto('/chat');
		}
	});

	async function signInWithGoogle() {
		if (!browser) return;

		try {
			loading = true;
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
			// Navigation will be handled by the effect
		} catch (error) {
			console.error('Error signing in with Google:', error);
			// You might want to show an error message to the user
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-md space-y-12">
	<!-- Header -->
	<div class="text-center">
		<h1 class="glitch text-neon-purple text-4xl font-bold md:text-5xl" data-text="ACCESS_PORTAL">
			ACCESS_PORTAL
		</h1>
		<p class="text-neon-cyan/80 mt-4 font-mono">Initialize connection sequence</p>
	</div>

	<!-- Login Container -->
	<div
		class="card bg-base-100/10 border-neon-cyan/20 space-y-6 rounded-xl border-2 p-8 backdrop-blur-sm"
	>
		<div class="text-center">
			<p class="text-neon-green/80 mb-6 font-mono">SELECT_AUTH_METHOD:</p>
		</div>

		<button
			onclick={signInWithGoogle}
			class="btn btn-block bg-neon-purple/20 border-neon-purple hover:bg-neon-cyan/20 hover:border-neon-cyan text-neon-purple hover:text-neon-cyan hover-glow border-2 font-mono"
			disabled={!browser || loading || userStore.isLoading()}
		>
			{#if !browser || loading || userStore.isLoading()}
				<span class="loading loading-dots"></span>
			{:else}
				<div class="flex items-center justify-center gap-3">
					<svg class="h-5 w-5" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="currentColor"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="currentColor"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="currentColor"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					CONNECT_WITH_GOOGLE [↗]
				</div>
			{/if}
		</button>

		<div class="text-neon-cyan/50 mt-6 text-center font-mono text-sm">
			[System]: Authentication required to access secure connection
		</div>
	</div>
</div>
