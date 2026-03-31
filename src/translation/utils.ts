import {defaultLang, ui} from './ui';

/**
 * 翻訳関数 t('key') を提供する関数
 * @param lang - 現在の言語 (Astro.locals.lang などから渡す)
 */
export function useTranslations(lang: string | undefined) {
    // langが有効なキーか判定。無効ならデフォルト(en)を採用
    const currentLang = (lang && lang in ui) ? (lang as keyof typeof ui) : defaultLang;

    return function t(key: keyof typeof ui[typeof defaultLang]) {
        // 指定した言語にキーがない場合はデフォルト言語にフォールバック
        return ui[currentLang][key] || ui[defaultLang][key];
    };
}

/**
 * 現在の言語に応じたURLパスを生成する関数
 * 例: l('/home') -> 日本語なら '/ja/home', 英語なら '/home'
 */
export function useTranslatedPath(lang: string | undefined) {
    const currentLang = (lang && lang in ui) ? (lang as keyof typeof ui) : defaultLang;

    return function l(path: string) {
        const base = currentLang === defaultLang ? "" : `/${currentLang}`;
        // パスの整形（スラッシュの重複を防ぐ）
        const cleanPath = path.startsWith("/") ? path : `/${path}`;

        // ルートパスの場合、英語なら "/"、日本語なら "/ja" (最後尾にスラッシュを付けない)
        if (cleanPath === "/") return base === "" ? "/" : base;

        return `${base}${cleanPath}`;
    };
}