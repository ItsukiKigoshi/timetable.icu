import {useState} from 'react';
import type {Categories, CourseWithSchedules} from "@/db/schema";
import {useTimetable} from "@/lib/timetable/hooks.ts";
import {
    ArrowDown01,
    CalendarCheck,
    Languages,
    ListFilter,
    Plus,
    Search,
    SquareArrowOutUpRight,
    Trash2,
    X
} from "lucide-react";
import {SELECTABLE_DAYS} from "@/constants/time.ts";
import {createTranslationHelper} from "@/lib/translation/utils.ts";
import {defaultLang} from "@/lib/translation/ui.ts";
import courseUpdateInfo from '@/db/data/course-last-update.json';
import {formatUnits, getSyllabusUrl} from "@/lib/course/utils.ts";

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
    language: string | null;
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
                                             lang = defaultLang
                                         }: Props) {
    const {t, isJa} = createTranslationHelper(lang);
    const [courses, setCourses] = useState<CourseWithSchedules[]>(initialResults);
    const [hasNextPage, setHasNextPage] = useState(initialHasNext);
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    // 処理を軽くするためにreginteredIdsだけをAstroから受けとるようにした方がいいよな
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
            language: null,
            page: 1
        });
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    };

    const lastUpdateStr = new Date(courseUpdateInfo.courseLastUpdatedAt).toLocaleString(isJa ? "ja-JP" : "en-US", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

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

                {/*言語選択*/}
                <label className="input input-bordered flex items-center gap-2 w-fit bg-base-100/50 backdrop-blur-md shadow-sm group">
                    <Languages />
                    <select
                        className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none font-medium"
                        value={filters.language || ''}
                        onChange={(e) => update({language: e.target.value || null})}
                    >
                        <option value="">{isJa ? "言語" : "Language"}</option>
                        <option value="J">{isJa ? "日本語" : "Japanese"}</option>
                        <option value="E">{isJa ? "英語" : "English"}</option>
                        <option value="O">{isJa ? "その他" : "Other"}</option>
                        {/* 明示的に language が設定されていないものを探すための選択肢 */}
                        <option value="null">{isJa ? "指定なし" : "Not Specified"}</option>
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
                        <section key={course.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                            <div className="card-body p-4 gap-3">
                                {/* ヘッダーセクション: コード，言語，単位数，年度 */}
                                <div className="flex justify-between items-start text-[10px] sm:text-xs">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {/* コースコード */}
                                        <span className="badge badge-neutral badge-xs px-1.5 py-2 font-mono tracking-tighter">
                                          {course.courseCode}
                                        </span>
                                        {/* 言語 */}
                                        {course.language && (
                                            <span className="badge badge-xs font-bold badge-outline text-base-content/50">
                                                {course.language}
                                              </span>
                                        )}
                                    </div>

                                    {/* 右側: 年度・学期，単位数 */}
                                    <div className="flex justify-between items-start text-[10px] sm:text-xs">
                                        {/* 単位数 */}
                                        {course.units > 0 && (
                                            <span className="badge badge-outline badge-xs text-base-content/50">
                                                    {formatUnits(course.units)} {t('explore.units')}
                                                  </span>
                                        )}
                                        <span className="text-base-content/50 whitespace-nowrap ml-2">
                                            {course.year} {course.term}
                                        </span>
                                    </div>
                                </div>

                                {/* タイトル・教員セクション */}
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 mb-1">
                                        {isJa ? course.titleJa : course.titleEn}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-base-content/60 truncate">
                                        {course.instructor}
                                    </p>
                                </div>

                                {/* スケジュールセクション */}
                                <div className="flex flex-wrap gap-1">
                                    {course.schedules?.length > 0 ? (
                                        course.schedules.map((s, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded bg-base-200 text-[10px] font-mono font-bold uppercase">
                                                {s.dayOfWeek.slice(0, 2)}{s.period}{s.isLong ? "*" : ""}
                                              </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] opacity-40 italic">{t('explore.no_schedule')}</span>
                                    )}
                                </div>

                                {/* アクションセクション */}
                                <nav className="card-actions flex justify-between items-center mt-2 pt-3 border-t border-base-100">
                                    <a target='_blank' rel="noopener noreferrer"
                                       href={getSyllabusUrl(course.rgNo, course.year, course.term)}
                                       className="btn btn-ghost btn-md gap-1.5 px-2 font-normal">
                                        <span className="text-[10px] sm:text-xs">{t('explore.syllabus')}</span>
                                        <SquareArrowOutUpRight size="12"/>
                                    </a>

                                    <button
                                        onClick={() => handleToggle(course)}
                                        disabled={loading}
                                        className={`btn btn-md min-w-20 ${isAdded ? 'btn-error' : 'btn-primary'}`}
                                    >
                                        {loading ? <span className="loading loading-spinner loading-xs"></span> :
                                            isAdded ? <><Trash2 size="12"/>{t('explore.remove')}</> :
                                                <><Plus size="12"/>{t('explore.add')}</>}
                                    </button>
                                </nav>
                            </div>
                        </section>
                    );
                })}
            </div>

            {courses.length === 0 && (
                <section className="alert shadow-sm">
                    {isJa ? (
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">該当する授業が見つかりません．</h3>
                            <p className="text-sm">
                                最新の授業情報は <a target="_blank" className="link font-semibold" href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx">公式シラバス</a> をご確認ください．
                            </p>
                            <div className="text-xs opacity-60 pt-2 border-t border-base-content/10">
                                <p>※休講（Cancelled）および Co-Listing 科目は表示されません．</p>
                                <p className="mt-1">
                                    （Co-Listing：他メジャー開講だが，自身のメジャー単位として認められる科目 [ <a className="link" href="https://sites.google.com/icu.ac.jp/icu-ehandbook/%E3%83%9B%E3%83%BC%E3%83%A0_japanese/%E5%B1%A5%E4%BF%AE%E6%A1%88%E5%86%85/%E5%8D%92%E6%A5%AD%E3%81%AE%E8%A6%81%E4%BB%B6">出典</a> ]）
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">No course found.</h3>
                            <p className="text-sm">
                                Please refer to the <a target="_blank" className="link font-semibold" href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx">Official Course Offerings</a> for latest information.
                            </p>
                            <div className="text-xs opacity-60 pt-2 border-t border-base-content/10">
                                <p>*Cancelled and Co-Listing courses are not shown here.</p>
                                <p className="mt-1">
                                    (Co-Listing: Courses outside your major that count toward major requirements [ <a className="link" href="https://sites.google.com/icu.ac.jp/icu-ehandbook/home_english/guide-to-academic-matters/graduation-requirements">source</a> ])
                                </p>
                            </div>
                        </div>
                    )}

                </section>
            )}

            {isJa ? (<p className="mb-2">データ更新日: {lastUpdateStr} (JST)</p>): <p className="mb-2">Last Updated at {lastUpdateStr} (JST)</p>}
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