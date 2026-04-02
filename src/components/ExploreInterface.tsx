import {useState} from 'react';
import type {Categories, CourseWithSchedules} from "@/db/schema";
import {useTimetable} from "@/lib/useTimetable";
import {ArrowDown01, CalendarCheck, ListFilter, Plus, Search, SquareArrowOutUpRight, X} from "lucide-react";
import {SELECTABLE_DAYS} from "@/constants/time.ts";
import {seasonToNumber} from "@/components/TimetableInterface.tsx";
import {useLanguage} from "@/translation/utils.ts";
import {defaultLang} from "@/translation/ui.ts";

export interface SearchFilters {
    year: string | null;
    term: string | null;
    day: string | null;
    period: string | null;
    isLong: string | null;
    categoryId: string | null;
    q: string | null;
    slots: string[] | null;
    units: string | null;
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

const formatUnits = (units: number): string => {
    // 0.333... の対策（浮動小数点の誤差を考慮して 0.33 より大きく 0.34 未満なら 1/3）
    if (units > 0.33 && units < 0.34) return "1/3";
    if (units > 0.66 && units < 0.67) return "2/3";

    // それ以外は通常の数値を文字列にして返す（整数ならそのまま、小数なら適宜丸める）
    return units.toString();
};

export default function ExploreInterface({
                                             initialResults,
                                             initialFilters,
                                             categories,
                                             initialUserCourseIds,
                                             user,
                                             hasNextPage: initialHasNext,
                                             lang = defaultLang
                                         }: Props) {
    const {t, isJa} = useLanguage(lang);
    const [courses, setCourses] = useState<CourseWithSchedules[]>(initialResults);
    const [hasNextPage, setHasNextPage] = useState(initialHasNext);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    const {registeredIds, toggleCourse, isInitialized} = useTimetable({
        initialCourseIds: initialUserCourseIds,
        user
    });

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

    const update = (newParams: Partial<SearchFilters>) => {
        const nextFilters = {...filters, ...newParams};
        nextFilters.page = newParams.page === undefined ? 1 : Number(newParams.page);

        window.scrollTo({top: 0, behavior: 'smooth'});

        const url = new URL(window.location.href);
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value.toString());
            }
        });
        window.history.pushState({}, '', url);
        setFilters(nextFilters);
        fetchData(nextFilters);
    };

    const Pagination = () => (
        <nav className="flex justify-center py-6">
            <div className="join shadow-sm">
                <button className="join-item btn btn-sm sm:btn-md" disabled={filters.page <= 1}
                        onClick={() => update({page: filters.page - 1})}>«
                </button>
                <button
                    className="join-item btn btn-sm sm:btn-md no-animation cursor-default pointer-events-none font-mono">Page {filters.page}</button>
                <button className="join-item btn btn-sm sm:btn-md" disabled={!hasNextPage}
                        onClick={() => update({page: filters.page + 1})}>»
                </button>
            </div>
        </nav>
    );

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

    const clearFilters = () => {
        update({
            day: null,
            period: null,
            isLong: null,
            categoryId: null,
            q: '',
            slots: [],
            units: null,
            page: 1
        });
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    };

    const majorCategories = categories.filter(c => c.id?.startsWith('M') && c.id !== "MSTH");
    const otherCategories = categories.filter(c => !(c.id?.startsWith('M') && c.id !== "MSTH"));

    return (
        <div className="space-y-6">
            {/* フィルターセクション */}
            <div className="flex flex-wrap gap-3 items-center">
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


                <label
                    className="input input-bordered flex items-center gap-2 w-fit bg-base-100/50 backdrop-blur-md shadow-sm group">
                    <ArrowDown01/>
                    <select
                        className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none font-medium"
                        value={filters.units || ''}
                        onChange={(e) => update({units: e.target.value || null})}
                    >
                        <option value="">{t('explore.units')}</option>
                        <option value="0.333">1/3</option>
                        {["1", "2", "3", "4", "5", "6"].map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </label>


                {/* --- 全条件クリアボタン (year, term以外) --- */}
                <button
                    type="button"
                    className="btn btn-md btn-outline flex items-center gap-2 text-error"
                    onClick={clearFilters}
                >
                    <X size={18}/>
                    <span className="inline font-medium">{t('explore.clear_selection')}</span>
                </button>
            </div>

            <Pagination/>

            {/* 結果表示 */}
            <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {courses.map((course) => {
                    const isAdded = registeredIds.has(course.id);
                    const loading = isSubmitting === course.id || !isInitialized;

                    return (
                        <div key={course.id}
                             className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                            <div className="card-body p-4 gap-3">
                                <div
                                    className="flex justify-between items-center text-[10px] sm:text-xs text-base-content/50">
                                    <span className="text-xs text-base-content/50">
                                        {course.courseCode}
                                        {course.units > 0 && (
                                            <span>
                                                ・{formatUnits(course.units)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="whitespace-nowrap">{course.year} {course.term}</span>
                                </div>

                                <div>
                                    <h2 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 mb-1">{isJa ? course.titleJa : course.titleEn}</h2>
                                    <p className="text-xs sm:text-sm text-base-content/60 truncate">{course.instructor}</p>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {course.schedules?.length > 0 ? (
                                        course.schedules.map((s, i) => (
                                            <span key={i}
                                                  className="px-1.5 py-0.5 rounded bg-base-200 text-[10px] font-mono font-bold uppercase">
                                                {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                                            </span>
                                        ))
                                    ) : (
                                        <span
                                            className="text-[10px] opacity-40 italic">{t('explore.no_schedule')}</span>
                                    )}
                                </div>

                                <div
                                    className="card-actions flex justify-between items-center mt-2 pt-3">
                                    <a target='_blank' rel="noopener noreferrer"
                                       href={`https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${course.rgNo}&year=${course.year}&term=${seasonToNumber(course.term)}`}
                                       className="btn gap-1.5 px-2 font-normal">
                                        <span className="text-[10px] sm:text-xs">{t('explore.syllabus')}</span>
                                        <SquareArrowOutUpRight size="14"/>
                                    </a>

                                    <button
                                        onClick={() => handleToggle(course)}
                                        disabled={loading}
                                        className={`btn min-w-20 ${isAdded ? 'btn-error border-none bg-error text-error-content' : 'btn-primary'}`}
                                    >
                                        {loading ?
                                            <span className="loading loading-spinner loading-xs"></span> : isAdded ? <>
                                                <X size="14"/>{t('explore.remove')}</> : <><Plus
                                                size="14"/>{t('explore.add')}</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Pagination/>

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
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}