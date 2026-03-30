import {getAuth} from "@/lib/auth.ts";
import {defineMiddleware} from "astro:middleware";
import {env} from "cloudflare:workers";
import {DEFAULT_TERM, DEFAULT_YEAR} from "@/constants/time.ts";

// middleware.ts
export const onRequest = defineMiddleware(async (context, next) => {
    if (!env) return next();

    // 1. D1へのアクセスをスキップするパスを定義
    const url = new URL(context.request.url);
    const isStaticPage = url.pathname === "/" || url.pathname.startsWith("/_astro") || url.pathname === "/favicon.svg";

    if (isStaticPage) {
        context.locals.user = null;
        context.locals.dbError = false;
        return next(); // D1を叩かずに次へ
    }

    // 2. それ以外のページ（/explore, /timetableなど）のみAuthを実行
    try {
        const auth = getAuth(env);
        const sessionData = await auth.api.getSession({
            headers: context.request.headers,
        });

        context.locals.user = sessionData?.user ?? null;
        context.locals.dbError = false;
    } catch (error) {
        console.error("D1 is down:", error);
        context.locals.user = null;
        context.locals.dbError = true;
    }

    return next();
});