import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(),
	sveltekit()],
	server: {
		watch: {
			ignored: ['**/babak.json', '**/paket_soal.json']
		}
	}
});
