// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { defaultLang, languages } from "./src/lib/translation/ui"; // @エイリアスは使えない

// https://astro.build/config
export default defineConfig({
	site: "https://timetable.icu",
	output: "server",
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
				ignored: ["**/.wrangler/**", "README.md"],
			},
		},
	},
});
