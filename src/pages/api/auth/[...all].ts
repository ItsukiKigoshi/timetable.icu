import {getAuth} from "@/lib/auth/server.ts";
import type {APIRoute} from "astro";
import {env} from "cloudflare:workers";

export const ALL: APIRoute = async (ctx) => {
    const auth = getAuth(env, ctx.request);
    return auth.handler(ctx.request);
};