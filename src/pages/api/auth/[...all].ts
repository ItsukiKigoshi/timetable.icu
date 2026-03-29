import {getAuth} from "@/lib/auth.ts";
import type {APIRoute} from "astro";
import {env} from "cloudflare:workers";

export const ALL: APIRoute = async (ctx) => {
    // If you want to use rate limiting, make sure to set the 'x-forwarded-for' header to the request headers from the context
    // ctx.request.headers.set("x-forwarded-for", ctx.clientAddress);
    const auth = getAuth(env);

    return auth.handler(ctx.request);
};

