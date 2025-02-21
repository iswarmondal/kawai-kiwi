/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'neon-cyan': '#00f3ff',
				'neon-pink': '#ff00ff',
				'neon-green': '#00ff00',
				'neon-purple': '#bc13fe'
			},
			animation: {
				float: 'float 6s ease-in-out infinite',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			}
		}
	},
	plugins: [daisyui]
};
