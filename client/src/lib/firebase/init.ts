// Import the functions you need from the SDKs you need
import { browser } from '$app/environment';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth, onAuthStateChanged } from 'firebase/auth';
import { userStore } from '$lib/stores/user.svelte';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyBix69FXKXDY8jH4K6q6IJKmtTReXquQSo',
	authDomain: 'oom-angle.firebaseapp.com',
	projectId: 'oom-angle',
	storageBucket: 'oom-angle.firebasestorage.app',
	messagingSenderId: '483844963846',
	appId: '1:483844963846:web:eedf6aeae2fd15c43fcd87',
	measurementId: 'G-HMYZV5W912'
};

// Initialize Firebase only in the browser
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics;

if (browser) {
	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
	analytics = getAnalytics(app);

	// Set up auth state listener
	onAuthStateChanged(auth, (user) => {
		userStore.setUser(user);
	});
}

export { app, auth, analytics };
