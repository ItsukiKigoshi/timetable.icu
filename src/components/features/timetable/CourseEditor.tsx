import {LanguageProvider} from "@/lib/translation/context";
import React, {useEffect, useState} from 'react';
import {createTranslationHelper} from "@/lib/translation/utils.ts";
import {PERIODS, SELECTABLE_DAYS} from "@/constants/time.ts";
import {SWATCHES} from "@/constants/config.ts";
import {useTimetable} from "@/lib/timetable/hooks.ts";

interface CourseEditorProps {
    mode: 'create' | 'edit';
    lang: string;
    targetId?: string;
    initialData?: any;
    user: any;
    selectedYear: number;
    selectedTerm: string;
}

const CourseEditor = ({ mode, lang, targetId, initialData, user, selectedYear, selectedTerm }: CourseEditorProps) => {
    const { l } = createTranslationHelper(lang);

    // SSR対策: マウント完了フラグ
    const [isMounted, setIsMounted] = useState(false);

    const { courses, saveCustomCourse } = useTimetable({
        user,
        selectedYear,
        selectedTerm,
    });

    const normalizeInitialData = (data: any) => ({
        id: data?.id || undefined,
        title: data?.title || data?.titleJa || '',
        instructor: data?.instructor || data?.instructorJa || '',
        units: data?.units ?? 0,
        memo: data?.memo || '',
        room: data?.room || '',
        colorCustom: data?.colorCustom || null,
        schedules: (data?.schedules || []).map((s: any) => ({
            ...s,
            id: s.id || `temp-sched-${Math.random().toString(36).substr(2, 9)}`
        })),
    });

    // 1. 初期化フラグ: 編集モードでデータが来るまでは false
    const [isInitialized, setIsInitialized] = useState(mode === 'create' || !!initialData);

    // 2. フォームデータ
    const [formData, setFormData] = useState(() => {
        if (mode === 'create' || initialData) {
            return normalizeInitialData(initialData);
        }
        return normalizeInitialData(null);
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // マウント時とデータ取得時の同期
    useEffect(() => {
        setIsMounted(true); // ブラウザ側で実行開始された証

        if (isInitialized || mode === 'create') return;

        let foundData = null;
        if (initialData) {
            foundData = initialData;
        } else if (mode === 'edit' && targetId && courses.length > 0) {
            foundData = courses.find(c => String(c.id) === String(targetId));
        }

        if (foundData) {
            setFormData(normalizeInitialData(foundData));
            setIsInitialized(true);
        }
    }, [initialData, courses, targetId, mode, isInitialized]);

    // --- ハンドラー ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!isInitialized) return;
        const { name, value } = e.target;
        if (!name) return;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'units' ? parseFloat(value) : value
        }));
    };

    const toggleSchedule = (day: string, pLabel: string) => {
        if (!isInitialized) return;
        const periodData = PERIODS.find(p => p.label === pLabel);
        if (!periodData) return;

        const isSelected = formData.schedules.some((s: any) => s.dayOfWeek === day && s.period === pLabel);

        if (isSelected) {
            setFormData(prev => ({
                ...prev,
                schedules: prev.schedules.filter((s: any) => !(s.dayOfWeek === day && s.period === pLabel))
            }));
        } else {
            const newSchedule = {
                id: `temp-sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                dayOfWeek: day,
                period: pLabel,
                startTime: periodData.start,
                endTime: periodData.end
            };
            setFormData(prev => ({
                ...prev,
                schedules: [...prev.schedules, newSchedule]
            }));
        }
    };

    const updateColor = (hex: string | null) => {
        if (!isInitialized) return;
        setFormData(prev => ({ ...prev, colorCustom: hex }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isInitialized || isSubmitting) return;

        if (formData.schedules.length === 0) {
            alert("スケジュールを1つ以上選択してください");
            return;
        }
        setIsSubmitting(true);
        try {
            await saveCustomCourse({
                ...formData,
                year: selectedYear,
                term: selectedTerm,
            });
            window.location.href = l('/timetable');
        } catch (error) {
            console.error(error);
            alert("保存に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ロード画面の判定 ---
    // 「ブラウザでJSがまだ動いていない(SSR/Hydration中)」または「編集データが準備できていない」場合
    if (!isMounted || (!isInitialized && mode === 'edit')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-sm opacity-60 animate-pulse">データを読み込み中...</p>
            </div>
        );
    }

    return (
        <LanguageProvider lang={lang}>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 flex flex-col gap-6 pb-20">
                <header>
                    <h1 className="text-2xl font-bold">
                        {mode === 'create' ? '新規コース作成' : 'コース編集'}
                    </h1>
                </header>

                <fieldset
                    disabled={isSubmitting}
                    className="flex flex-col gap-6 border-none p-0 m-0"
                >
                    {/* 科目名（必須） */}
                    <div className="form-control">
                        <label className="label font-bold">科目名（必須）</label>
                        <input
                            type="text"
                            name="title"
                            className="input input-bordered w-full"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label font-bold">教員名</label>
                            <input
                                type="text"
                                name="instructor"
                                className="input input-bordered w-full"
                                value={formData.instructor}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label font-bold">教室</label>
                            <input
                                type="text"
                                name="room"
                                className="input input-bordered w-full"
                                value={formData.room}
                                onChange={handleChange}
                                placeholder="例: H-101"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label font-bold text-sm">単位数</label>
                            <select
                                name="units"
                                className="select select-bordered"
                                value={formData.units}
                                onChange={handleChange}
                            >
                                <option value={0}>0</option>
                                <option value={0.333}>1/3</option>
                                {[1, 2, 3, 4, 5, 6].map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label font-bold">表示色</label>
                            <div className="flex items-center join">
                                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-md bg-base-100">
                                    <div
                                        className="w-6 h-6 rounded-full border border-black/10 shadow-sm"
                                        style={{ backgroundColor: formData.colorCustom || "var(--color-primary)" }}
                                    />
                                </div>
                                <div className="dropdown dropdown-bottom dropdown-end flex-1">
                                    <div tabIndex={0} className="flex items-center h-10 px-3 bg-base-100 border border-base-300 rounded-md shadow-sm focus-within:border-primary transition-all">
                                        <span className="text-xs opacity-30 font-mono mr-1.5">#</span>
                                        <input
                                            type="text"
                                            value={formData.colorCustom ? formData.colorCustom.replace('#', '') : ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                    updateColor(val ? `#${val}` : null);
                                                }
                                            }}
                                            className="w-full bg-transparent border-none outline-none font-mono text-sm p-0"
                                            placeholder="DEFAULT"
                                        />
                                    </div>
                                    <div className="dropdown-content z-30 mt-1 p-2 bg-base-100 border border-base-300 rounded-md shadow-xl w-72">
                                        <div className="grid grid-cols-7 gap-2">
                                            <button type="button" onClick={() => updateColor(null)} className="w-8 h-8 rounded border flex items-center justify-center bg-base-200">
                                                <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" /></svg>
                                            </button>
                                            {SWATCHES.map((hex) => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => { updateColor(hex); (document.activeElement as HTMLElement)?.blur(); }}
                                                    className={`w-8 h-8 rounded border border-black/5 ${formData.colorCustom === hex ? 'ring-2 ring-primary' : ''}`}
                                                    style={{ backgroundColor: hex }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label font-bold">スケジュール</label>
                        <div className="overflow-x-auto rounded-lg border border-base-300">
                            <table className="table table-fixed w-full text-center">
                                <thead>
                                <tr className="bg-base-200">
                                    <th className="w-12 p-0"></th>
                                    {SELECTABLE_DAYS.map(d => <th key={d} className="p-2 text-xs">{d}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {PERIODS.map(p => (
                                    <tr key={p.label}>
                                        <th className="bg-base-200/50 p-0 text-xs flex flex-col items-center justify-center h-12">
                                            <span className="text-[8px] font-normal opacity-50">{p.start}</span>
                                            <span>{p.label}</span>
                                        </th>
                                        {SELECTABLE_DAYS.map(day => {
                                            const isSelected = formData.schedules.some((s: any) => s.dayOfWeek === day && s.period === p.label);
                                            return (
                                                <td
                                                    key={`${day}-${p.label}`}
                                                    className={`border border-base-300 cursor-pointer transition-colors p-0 h-12 ${isSelected ? 'bg-primary' : 'hover:bg-base-200'}`}
                                                    onClick={() => toggleSchedule(day, p.label)}
                                                >
                                                    {isSelected && <div className="text-primary-content font-bold">✓</div>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label font-bold">メモ</label>
                        <textarea
                            name="memo"
                            className="textarea textarea-bordered w-full h-24"
                            value={formData.memo}
                            onChange={handleChange}
                            placeholder="例: レポート締め切りなど"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                            {isSubmitting ? <span className="loading loading-spinner"></span> : '保存する'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => window.history.back()} disabled={isSubmitting}>
                            キャンセル
                        </button>
                    </div>
                </fieldset>
            </form>
        </LanguageProvider>
    );
};

export default CourseEditor;