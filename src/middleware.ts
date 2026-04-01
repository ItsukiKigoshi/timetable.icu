import {getAuth} from "@/lib/auth.ts";
import {defineMiddleware} from "astro:middleware";
import {DEFAULT_TERM, DEFAULT_YEAR} from "@/constants/time.ts";
import {env} from "cloudflare:workers";
import {defaultLang, type Language, ui} from "@/translation/ui.ts";

export const onRequest = defineMiddleware(async (context, next) => {
    // 開発環境などで env がない場合のフォールバック（Workers上では通常 env は存在する）
    if (!env) return next();

    const {url, cookies, request, redirect} = context;
    const pathname = url.pathname;

    // 静的アセットの除外
    if (
        pathname.startsWith('/_image') ||
        pathname.startsWith('/_astro') ||
        pathname.includes('.')  // .png, .svg などの静的ファイル対策を雑に対策
    ) {
        return next();
    }

    // --- 1. i18n Language Management ---
    const isEnUrl = pathname.startsWith('/en/') || pathname === '/en';
    const currentLang = isEnUrl ? 'en' : 'ja';

    // locals にセット（各 .astro ファイルで Astro.locals.lang として使う）
    context.locals.lang = currentLang;

    let langCookie = cookies.get('lang')?.value;

    // A. 初回訪問（Cookieなし）でルートに来た時だけ自動振り分け
    if (!langCookie && (pathname === '/' || pathname === '')) {
        const acceptLang = request.headers.get('accept-language')?.split(',')[0].toLowerCase() || "";
        // ブラウザの第1言語コード（例: "ja-JP" -> "ja"）を取得
        const browserLang = acceptLang.split('-')[0];

        // browserLang が ui のキー（'en', 'ja'）に含まれているか判定
        // 含まれていればその言語、そうでなければ 'en' を採用
        const detectedLang: Language = (browserLang in ui)
            ? (browserLang as Language)
            : 'en';

        // 判定結果をCookieに保存
        cookies.set('lang', detectedLang, { path: '/', maxAge: 60 * 60 * 24 * 365 });

        // デフォルトでないなら、その言語のディレクトリ（/en/ など）へ飛ばす
        if (detectedLang !== defaultLang) {
            return redirect(`/${detectedLang}/`);
        }

        context.locals.lang = defaultLang;
    }

    // B. URLの言語と現在のCookieがズレていたら、Cookie側をURLに合わせる（同期）
    // これにより、ユーザーが手動でURLを書き換えても設定が保存される
    if (langCookie !== currentLang) {
        cookies.set('lang', currentLang, {path: '/', maxAge: 60 * 60 * 24 * 365});
    }

    // --- 2. Session Management (リダイレクトしない場合のみ実行) ---
    try {
        const auth = getAuth(env);
        const sessionData = await auth.api.getSession({
            headers: request.headers,
        });

        context.locals.user = sessionData?.user ?? null;
        context.locals.session = sessionData?.session ?? null;
        context.locals.dbError = false;
    } catch (error) {
        console.error("D1 or Auth error, proceeding as guest:", error);
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