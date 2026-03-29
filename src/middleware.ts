import {getAuth} from "@/lib/auth.ts";
import {defineMiddleware} from "astro:middleware";
import {env} from "cloudflare:workers";
import {DEFAULT_TERM, DEFAULT_YEAR} from "@/constants/time.ts";

export const onRequest = defineMiddleware(async (context, next) => {
    if (!env) {
        console.warn("Cloudflare environment variables are not available.");
        return next();
    }

    // Session Management
    try {
        const auth = getAuth(env);

        const sessionData = await auth.api.getSession({
            headers: context.request.headers,
        });

        if (sessionData?.session) {
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

    // Selected Year & Term Management using Cookie
    const urlYear = context.url.searchParams.get('year');
    const urlTerm = context.url.searchParams.get('term');

    const cookieYear = context.cookies.get('year')?.number() || DEFAULT_YEAR;
    const cookieTerm = context.cookies.get('term')?.value || DEFAULT_TERM;

    const finalYear = urlYear ? Number(urlYear) : cookieYear;
    const finalTerm = urlTerm ? urlTerm : cookieTerm;

    if (urlYear || urlTerm) {
        const cookieOptions = {path: '/', maxAge: 60 * 60 * 24 * 365};
        context.cookies.set('year', String(finalYear), cookieOptions);
        context.cookies.set('term', finalTerm, cookieOptions);
    }

    context.locals.selectedYear = finalYear;
    context.locals.selectedTerm = finalTerm;

    return next();
});