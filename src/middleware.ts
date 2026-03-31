import {getAuth} from "@/lib/auth.ts";
import {defineMiddleware} from "astro:middleware";
import {DEFAULT_TERM, DEFAULT_YEAR} from "@/constants/time.ts";
import {env} from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
    // 開発環境などで env がない場合のフォールバック（Workers上では通常 env は存在する）
    if (!env) return next();

    const {url} = context;
    const pathname = url.pathname;

    // アセットや画像リクエストならスキップ ---
    if (
        pathname.startsWith('/_image') ||
        pathname.startsWith('/_astro') ||
        pathname.includes('.') // .png, .svg などの静的ファイル対策
    ) {
        return next();
    }

    const {cookies, request, redirect} = context;

    // --- 1. i18n Language Management ---
    const segments = pathname.split('/');
    const langInUrl = segments[1]; // 'ja' or 'en' or other
    const isJaUrl = langInUrl === 'ja';

    // Cookieの取得
    let lang = cookies.get('lang')?.value;

    // 【初回アクセス かつ トップページ】のみブラウザ言語で判定
    if (!lang && (pathname === '/' || pathname === '')) {
        const acceptLang = request.headers.get('accept-language');
        const detectedLang = (acceptLang && acceptLang.toLowerCase().startsWith('ja')) ? 'ja' : 'en';

        // 1. まずCookieを焼く
        cookies.set('lang', detectedLang, {path: '/', maxAge: 60 * 60 * 24 * 365});

        // 2. 日本語なら /ja/ へリダイレクトして即終了
        if (detectedLang === 'ja') {
            return redirect('/ja/');
        }

        // 3. 英語ならそのまま locals にセットして next() で即終了
        context.locals.lang = 'en';
        return next();
    }

// --- 2. URLベースの言語確定とCookie同期 (2回目以降や直リンク) ---
    const currentLang = isJaUrl ? 'ja' : 'en';
    context.locals.lang = currentLang;

// URLとCookieが食い違っている場合のみCookieを更新
    if (lang !== currentLang) {
        cookies.set('lang', currentLang, {path: '/', maxAge: 60 * 60 * 24 * 365});
    }

    // --- 2. Session Management (Early return 後に実行) ---
    try {
        const auth = getAuth(env);
        // getSessionは内部でDB(D1)を叩くため、リダイレクトが確定している場合は呼び出さないのが正解
        const sessionData = await auth.api.getSession({
            headers: request.headers,
        });

        context.locals.user = sessionData?.user ?? null;
        context.locals.session = sessionData?.session ?? null;
        context.locals.dbError = false;
    } catch (error) {
        console.error("D1 or Auth is down, proceeding as guest:", error);
        context.locals.user = null;
        context.locals.session = null;
        context.locals.dbError = true;
    }


    // --- 3. Selected Year & Term Management ---
    const urlYear = url.searchParams.get('year');
    const urlTerm = url.searchParams.get('term');

    const cookieYear = cookies.get('year')?.number() || DEFAULT_YEAR;
    const cookieTerm = cookies.get('term')?.value || DEFAULT_TERM;

    const finalYear = urlYear ? Number(urlYear) : cookieYear;
    const finalTerm = urlTerm ? urlTerm : cookieTerm;

    // URLパラメータがある場合のみCookieを更新
    if (urlYear || urlTerm) {
        const cookieOptions = {path: '/', maxAge: 60 * 60 * 24 * 365};
        if (urlYear) cookies.set('year', String(finalYear), cookieOptions);
        if (urlTerm) cookies.set('term', finalTerm, cookieOptions);
    }

    context.locals.selectedYear = finalYear;
    context.locals.selectedTerm = finalTerm;

    return next();
});