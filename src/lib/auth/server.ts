import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {drizzle} from "drizzle-orm/d1";
import {passkey} from "@better-auth/passkey";
import * as schema from "@/db/schema";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";

export const getAuth = (env: Env, request: Request) => {
  const url = new URL(request.url);

  const currentOrigin = url.hostname.includes("itsukikigoshi.workers.dev")
      ? `https://${url.hostname}`
      : "https://timetable.icu";

  return betterAuth({
    trustedOrigins: [
      "https://timetable.icu",
      "https://dev-timetable-icu.itsukikigoshi.workers.dev",
      "http://localhost:4321"
    ],
    database: drizzleAdapter(drizzle(env.timetable_icu), {
      provider: "sqlite",
      schema: schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    advanced: {
      cookiePrefix: "timetable-icu-auth",
    },
    plugins: [passkey()],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectURI: `${currentOrigin}/api/auth/callback/google`,
        prompt: "select_account",
        hd: "icu.ac.jp",
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/callback/:id") {
          const user = ctx.context.newSession?.user;
          if (user && !user.email.endsWith("@icu.ac.jp")) {
            const db = drizzle(env.timetable_icu);
            await db.delete(schema.user).where(eq(schema.user.id, user.id));
            throw ctx.redirect("/?error=INVALID_DOMAIN");
          }
        }
      }),
    }
  })
};