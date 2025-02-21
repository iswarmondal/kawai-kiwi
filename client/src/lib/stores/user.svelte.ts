import type { User } from 'firebase/auth';

class UserStore {
	// Global state for user
	private currentUser = $state<User | null>(null);
	private loading = $state(true);

	// Helper functions to manage user state
	setUser(user: User | null) {
		this.currentUser = user;
		this.loading = false;
	}

	isLoading() {
		return this.loading;
	}

	clearUser() {
		this.currentUser = null;
		this.loading = false;
	}

	getUser() {
		return this.currentUser;
	}
}

export const userStore = new UserStore();
