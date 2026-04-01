// @ts-check
import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';
import {defaultLang, languages} from "./src/translation/ui.ts"; // @エイリアスは使えない

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: cloudflare(),
    i18n: {
        defaultLocale: defaultLang,
        locales: languages,
        routing: {
            prefixDefaultLocale: false,
        },
    },
    integrations: [react()],
    vite: {
        plugins: [tailwindcss()],
        server: {
            watch: {
                ignored: ['**/.wrangler/**', 'README.md'],
            }
        }
    }
});