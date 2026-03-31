import {getAuth} from "@/lib/auth.ts";
import {defineMiddleware} from "astro:middleware";
import {env} from "cloudflare:workers";
import {DEFAULT_TERM, DEFAULT_YEAR} from "@/constants/time.ts";
import {defaultLang} from "@/translation/ui.ts";

export const onRequest = defineMiddleware(async (context, next) => {
    if (!env) {
        return next();
    }

    // i18n Language Management
    const {lang} = context.params;
    context.locals.lang = lang || defaultLang;

    // Session Management
    try {
        const auth = getAuth(env);
        const sessionData = await auth.api.getSession({
            headers: context.request.headers,
        });

        context.locals.user = sessionData?.user ?? null;
        context.locals.session = sessionData?.session ?? null;
        context.locals.dbError = false; // 正常
    } catch (error) {
        console.error("D1 or Auth is down, proceeding as guest:", error);

        // ユーザー情報を明示的に null にして「未ログイン状態」として続行させる
        context.locals.user = null;
        context.locals.session = null;
        context.locals.dbError = true;
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