import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth/server.ts";

export const ALL: APIRoute = async (ctx) => {
	const auth = getAuth(env, ctx.request);
	return auth.handler(ctx.request);
};
