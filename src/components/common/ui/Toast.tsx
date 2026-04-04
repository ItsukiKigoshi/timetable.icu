import {useEffect, useState} from 'react';
import { useSync } from "@/lib/course/hooks.ts";
import { getTranslations } from '@/lib/translation/utils';

export default function Toast({ user, lang }: { user?: any, lang: string }) {
    const t = getTranslations(lang);
  
    const { syncStatus } = useSync(user);
    const [show, setShow] = useState(false);

    // syncStatus が変わったら表示をONにする
    useEffect(() => {
        if (syncStatus !== 'idle') setShow(true);
    }, [syncStatus]);

    if (!show) return null;

    return (
        <div className="toast toast-top toast-center z-100">
            {/* 同期中 */}
            {syncStatus === 'syncing' && (
                <div className="alert alert-info shadow-lg">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span> {t('toast.sync.ing')} </span>
                </div>
            )}

            {/* 同期完了 */}
            {syncStatus === 'done' && (
                <div className="alert alert-success shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>{t('toast.sync.ed_reload')}</span>
                </div>
            )}

            {/* 同期失敗 */}
            {syncStatus === 'error' && (
                <div className="alert alert-warning shadow-lg">
                    <span>{t('toast.sync.fail')}</span>
                </div>
            )}
        </div>
    );
}