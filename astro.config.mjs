// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { legacyRedirects } from './src/config/legacy-redirects.ts';

export default defineConfig({
  site: 'https://erdemkosk.com',
  redirects: legacyRedirects,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
