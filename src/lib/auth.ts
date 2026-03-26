import {APIError, betterAuth} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/schema";

export const getAuth = (env: Env) => {
    return betterAuth({
        database: drizzleAdapter(
            drizzle(env.timetable_icu), {
                provider: "sqlite",
                schema: schema,
            }
        ),
        databaseHooks: {
            user: {
                create: {
                    before: async (user) => {
                        const allowedDomain = "icu.ac.jp";
                        const email = user.email.toLowerCase();

                        if (!email.endsWith(`@${allowedDomain}`)) {
                            throw new APIError("UNAUTHORIZED", {
                                message: `Access restricted to ${allowedDomain} accounts only.`
                            });
                        }
                    },
                },
            },
        },
        secret: env.BETTER_AUTH_SECRET,
        advanced: {
            cookiePrefix: "icu-auth",
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
        },

    });
};