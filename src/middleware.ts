import { getAuth } from "@/lib/auth";
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = new URL(context.request.url);
    console.log("Middleware trace", context.url.pathname)
    if (pathname.startsWith("/api/auth")) {
        return next();
    }

    if (!env) {
        console.warn("Cloudflare environment variables are not available.");
        return next();
    }

    try {
        const auth = getAuth(env);

        const sessionData = await auth.api.getSession({
            headers: context.request.headers,
        });

        if (sessionData) {
            context.locals.user = sessionData.user;
            context.locals.session = sessionData.session;
        } else {
            context.locals.user = null;
            context.locals.session = null;
        }
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        context.locals.user = null;
        context.locals.session = null;
    }

    return next();
});