import {APIError, betterAuth} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { passkey } from "@better-auth/passkey"
import * as schema from "@/db/schema.ts";

export const getAuth = (env: Env) => {
    return betterAuth({
        database: drizzleAdapter(
            drizzle(env.timetable_icu), {
                provider: "sqlite",
                schema: schema,
            }
        ),
        secret: env.BETTER_AUTH_SECRET,
        advanced: {
            cookiePrefix: "icu-auth",
        },
        plugins: [
            passkey(),
        ],
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                prompt: "select_account",
                hd: "icu.ac.jp",
            },
        },

    });
};