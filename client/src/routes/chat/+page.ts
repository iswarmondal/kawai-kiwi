import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { userStore } from '$lib/stores/user.svelte';

export const load = async () => {
	// During SSR, redirect to login
	// This ensures the page is protected even during SSR
	if (!browser) {
		throw redirect(302, '/login');
	}

	// Get current auth state
	const user = userStore.getUser();
	const isLoading = userStore.isLoading();

	// If still loading, return loading state
	// The page component should show a loading state
	if (isLoading) {
		return {
			user: null,
			loading: true
		};
	}

	// If no user or not authenticated, redirect to login
	if (!user) {
		throw redirect(302, '/login');
	}

	// User is authenticated, return user data
	return {
		user,
		loading: false
	};
};
