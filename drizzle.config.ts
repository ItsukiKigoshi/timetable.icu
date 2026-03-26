import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: ["./src/lib/schema.ts", "./src/lib/auth-schema.ts"],
    out: "./migrations",
});