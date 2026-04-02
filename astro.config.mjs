// @ts-check
import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import {defaultLang, languages} from "./src/translation/ui.ts"; // @エイリアスは使えない

// https://astro.build/config
export default defineConfig({
    site: 'https://timetable.icu',
    output: 'server',
    adapter: cloudflare(),
    integrations: [sitemap(), react()],
    i18n: {
        defaultLocale: defaultLang,
        locales: languages,
        routing: {
            prefixDefaultLocale: false,
        },
    },
    vite: {
        plugins: [tailwindcss()],
        server: {
            watch: {
                ignored: ['**/.wrangler/**', 'README.md'],
            }
        }
    }
});