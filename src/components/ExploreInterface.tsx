import React, {useState} from 'react';
import type {Categories, CourseWithSchedules} from "@/db/schema";
import {useTimetable} from "@/lib/useTimetable";
import {CalendarCheck, ListFilter, Plus, Search, SquareArrowOutUpRight, X} from "lucide-react";
import {ui} from "@/translation/ui.ts";
import {SELECTABLE_DAYS} from "@/constants/time.ts";
import {seasonToNumber} from "@/components/TimetableInterface.tsx";

export interface SearchFilters {
    year: string | null;
    term: string | null;
    day: string | null;
    period: string | null;
    isLong: string | null;
    categoryId: string | null;
    q: string | null;
    slots: string[] | null;
    page: number;
}

interface SearchResponse {
    results: CourseWithSchedules[];
    hasNextPage: boolean;
}

interface Props {
    initialResults: CourseWithSchedules[];
    initialFilters: SearchFilters;
    isLoggedIn: boolean;
    categories: Categories[];
    initialUserCourseIds: number[];
    user?: any;
    hasNextPage: boolean;
    lang?: string;
}

export default function ExploreInterface({
                                             initialResults,
                                             initialFilters,
                                             categories,
                                             initialUserCourseIds,
                                             user,
                                             hasNextPage: initialHasNext,
                                             lang = 'en' // デフォルト
                                         }: Props) {
    // 翻訳セットアップ
    const currentLang = (lang in ui ? lang : 'en') as keyof typeof ui;
    const t = (key: keyof typeof ui['en']) => ui[currentLang][key];
    const isJa = currentLang === 'ja';


    // 1. 状態管理
    const [courses, setCourses] = useState<CourseWithSchedules[]>(initialResults);
    const [hasNextPage, setHasNextPage] = useState(initialHasNext);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const {registeredIds, toggleCourse, isInitialized} = useTimetable({
        initialCourseIds: initialUserCourseIds,
        user
    });

    // 2. APIフェッチ関数
    const fetchData = async (nextFilters: SearchFilters) => {
        setIsFetching(true);
        try {
            const params = new URLSearchParams();
            Object.entries(nextFilters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) params.set(key, value.join(','));
                } else if (value) {
                    params.set(key, value.toString());
                }
            });

            const res = await fetch(`/api/courses?${params.toString()}`);
            const data = (await res.json()) as SearchResponse;

            setCourses(data.results);
            setHasNextPage(data.hasNextPage);
        } catch (e) {
            console.error("Failed to fetch courses:", e);
        } finally {
            setIsFetching(false);
        }
    };

    // 3. 検索条件の更新（URLのみ更新 & データ取得）
    const update = (newParams: Partial<SearchFilters>) => {
        // 新しいフィルタ状態を作成
        const nextFilters = {...filters, ...newParams};

        // ページ番号の調整（検索条件が変わったら1ページ目へ）
        if (newParams.page === undefined) {
            nextFilters.page = 1;
        } else {
            nextFilters.page = Number(newParams.page);
        }

        window.scrollTo({top: 0, behavior: 'smooth'});

        // URLパラメータの同期（見た目上のURLを書き換え）
        const url = new URL(window.location.href);
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value.toString());
            }
        });
        window.history.pushState({}, '', url);

        // 状態更新とデータ取得
        setFilters(nextFilters);
        fetchData(nextFilters);
    };


    const handleToggle = async (course: CourseWithSchedules) => {
        if (isSubmitting === course.id) return;
        setIsSubmitting(course.id);
        try {
            await toggleCourse(course);
        } finally {
            setIsSubmitting(null);
        }
    };

    const toggleSlot = (day: string, period: number) => {
        const slotStr = `${day}-${period}`;
        const currentSlots = filters.slots || [];
        const newSlots = currentSlots.includes(slotStr)
            ? currentSlots.filter(s => s !== slotStr)
            : [...currentSlots, slotStr];

        update({slots: newSlots});
    };

    const majorCategories = categories.filter(c => c.id?.startsWith('M') && (c.id !== "MSTH"));
    const otherCategories = categories.filter(c => !(c.id?.startsWith('M') && (c.id !== "MSTH")));

    return (
        <div className="space-y-6">
            {/* フィルターセクション */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <label
                    className="input input-bordered flex items-center gap-2 w-full max-w-xs shadow-sm bg-base-100/50 backdrop-blur-md">
                    <Search/>
                    <input
                        type="text"
                        className="grow"
                        placeholder={t('explore.search_placeholder')}
                        defaultValue={filters.q || ''}
                        onKeyDown={(e) => e.key === 'Enter' && update({q: e.currentTarget.value})}
                    />
                </label>

                <label
                    className="input input-bordered flex items-center gap-2 w-full max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm group">
                    <ListFilter/>
                    <select
                        className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none"
                        value={filters.categoryId || ''}
                        onChange={(e) => update({categoryId: e.target.value})}
                    >
                        <option value="">{t('explore.category_all')}</option>
                        <optgroup label={t('explore.category_major')}>
                            {majorCategories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {isJa ? c.nameJa : c.nameEn}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label={t('explore.category_others')}>
                            {otherCategories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {isJa ? c.nameJa : c.nameEn}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </label>

                <button
                    type="button"
                    className="btn btn-md flex items-center gap-2 w-fi max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm border-white/20 font-normal text-base-content"
                    onClick={() => (window as any).slot_modal.showModal()}
                >
                    <CalendarCheck/>
                    <span className="grow text-left">
                        {t('explore.select_slots')}
                        <span
                            className={`ml-2 text-xs ${(filters.slots?.length ?? 0) > 0 ? 'font-bold' : 'opacity-50'}`}>
                            ({filters.slots?.length ?? 0})
                        </span>
                    </span>
                </button>
            </div>

            {/* 時限モーダル */}
            <dialog id="slot_modal" className="modal modal-bottom">
                <div
                    className="modal-box p-0 overflow-hidden bg-base-100/95 border border-white/10 shadow-2xl sm:max-w-2xl md:max-w-3xl mx-auto">
                    <div className="p-4 sm:p-6">
                        <div className="overflow-x-auto rounded-xl border border-base-300 shadow-sm bg-base-100">
                            <table className="table table-fixed w-full text-center">
                                <thead>
                                <tr className="bg-base-200/50">
                                    <th className="w-12 bg-base-200/80"></th>
                                    {SELECTABLE_DAYS.map(d => <th key={d} className="font-bold">{d}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                                    <tr key={p}>
                                        <th className="bg-base-200/80 font-bold">{p}</th>
                                        {SELECTABLE_DAYS.map(day => {
                                            const isSelected = filters.slots?.includes(`${day}-${p}`);
                                            return (
                                                <td
                                                    key={`${day}-${p}`}
                                                    className={`cursor-pointer border border-base-300 h-14 transition-all ${
                                                        isSelected ? 'bg-primary text-primary-content' : 'hover:bg-primary/10'
                                                    }`}
                                                    onClick={() => toggleSlot(day, p)}
                                                >
                                                    {isSelected && (
                                                        <span className="flex justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline
                                                        points="20 6 9 17 4 12"/></svg>
                                                </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-action flex justify-between items-center mt-6">
                            <button
                                className="btn btn-ghost btn-sm text-error"
                                onClick={() => update({slots: []})}
                            >
                                {t('explore.clear_selection')}
                            </button>
                            <form method="dialog">
                                <button className="btn btn-outline border-base-100/40 px-10 shadow-lg">
                                    {t('explore.close')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </dialog>

            {/* ページネーション上 */}
            <nav className="flex flex-col items-center gap-4 py-6 mb-6">
                <div className="join">
                    <button
                        className="join-item btn"
                        disabled={filters.page <= 1}
                        onClick={() => update({page: filters.page - 1})}
                    >
                        «
                    </button>
                    <button className="join-item btn no-animation">
                        Page {filters.page}
                    </button>
                    <button
                        className="join-item btn"
                        disabled={!hasNextPage} // 次のページがあるかどうかで判定
                        onClick={() => update({page: filters.page + 1})}
                    >
                        »
                    </button>
                </div>
            </nav>

            {/* 結果表示セクション */}
            <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                {courses.map((course) => {
                    const isAdded = registeredIds.has(course.id);
                    const hasSchedules = course.schedules && course.schedules.length > 0;
                    const loading = isSubmitting === course.id || !isInitialized;

                    return (
                        <div key={course.id} className="card bg-base-100 shadow-sm border border-base-200">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-xs text-base-content/50 font-mono">{course.courseCode}</span>
                                    <span className="text-xs text-base-content/50">
                                        {course.year} {course.term}
                                    </span>
                                </div>

                                {/* タイトルの翻訳出し分け */}
                                <h2 className="card-title text-base mt-2 line-clamp-2">
                                    {isJa ? course.titleJa : course.titleEn}
                                </h2>

                                <p className="text-sm text-base-content/70">{course.instructor}</p>

                                <div className="flex flex-wrap gap-1 mt-1">
                                    {hasSchedules ? (
                                        course.schedules.map((s, i) => (
                                            <span key={i} className="badge badge-ghost badge-sm font-mono uppercase">
                                                {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs opacity-50">{t('explore.no_schedule')}</span>
                                    )}
                                </div>

                                <div className="card-actions flex justify-between mt-4">
                                    <a target='_blank'
                                       href={`https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${
                                           course.rgNo
                                       }&year=${course.year}&term=${seasonToNumber(
                                           course.term
                                       )}`}
                                       className="btn btn-sm">
                                        <span>{t('explore.syllabus')}</span>
                                        <SquareArrowOutUpRight size="16"/>
                                    </a>
                                    {(hasSchedules || isAdded) && (
                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={loading}
                                            className={`btn btn-sm gap-1 ${isAdded ? 'btn-error' : 'btn-primary'}`}
                                        >
                                            {loading ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : isAdded ? (
                                                <>{t('explore.remove')} <X size="16"/></>
                                            ) : (
                                                <>{t('explore.add')} <Plus size="16"/></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {courses.length === 0 && (
                    <div className="col-span-full text-center py-12 opacity-50">
                        {t('explore.no_results')}
                    </div>
                )}
            </div>

            {/* ページネーション下 */}
            <nav className="flex flex-col items-center gap-4 py-6 mb-6">
                <div className="join">
                    <button
                        className="join-item btn"
                        disabled={filters.page <= 1}
                        onClick={() => update({page: filters.page - 1})}
                    >
                        «
                    </button>
                    <button className="join-item btn no-animation">
                        Page {filters.page}
                    </button>
                    <button
                        className="join-item btn"
                        disabled={!hasNextPage} // 次のページがあるかどうかで判定
                        onClick={() => update({page: filters.page + 1})}
                    >
                        »
                    </button>
                </div>
            </nav>
        </div>
    );
}