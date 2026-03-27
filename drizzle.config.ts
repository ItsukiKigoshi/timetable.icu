import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
    out: "./migrations",
    dbCredentials: {
        url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/93bf182b87b50804aa043b51827ca034584e88c21400242a961a0dbf0c53a9a7.sqlite',
    },
});