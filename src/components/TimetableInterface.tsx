import type {FlatSchedule} from "@/db/schema.ts";
import {END_TIME, PERIODS, SELECTABLE_DAYS, START_TIME} from "@/constants/time.ts";
import type {User} from "better-auth";
import {timeToMin} from "@/lib/timetable.ts";
import {useEffect, useMemo, useState} from "react";
import {Eye, EyeOff, LayoutGrid, List, SquareArrowOutUpRight, StickyNote, Trash2} from "lucide-react";
import {ui} from "@/translation/ui.ts";
import {useLanguage} from "@/translation/utils.ts";
import {formatUnits} from "@/components/ExploreInterface.tsx";
import {useTimetable} from "@/lib/useTimetable.ts";

const HEADER_HEIGHT = 20;

export const seasonToNumber = (season: string | null): number => {
    switch (season) {
        case "Spring":
            return 1;
        case "Autumn":
            return 2;
        case "Winter":
            return 3;
        default:
            return 0;
    }
};

/**
 * 単位数を "整数+分数" 形式でフォーマットする
 * 例: 2.333 -> "2+1/3", 0.666 -> "0+2/3" (または "2/3")
 */
export const formatDisplayUnits = (units: number): string => {
    const integerPart = Math.floor(units);
    const decimalPart = units - integerPart;

    let fraction = "";
    // 許容誤差範囲を 0.02 程度に設定
    if (decimalPart > 0.31 && decimalPart < 0.35) {
        fraction = "1/3";
    } else if (decimalPart > 0.64 && decimalPart < 0.68) {
        fraction = "2/3";
    }

    if (fraction) {
        // 常に "整数+分数" 形式にする場合
        return `${integerPart}+${fraction}`;

        // もし整数が0の時に "+" を出したくない場合は以下:
        // return integerPart > 0 ? `${integerPart}+${fraction}` : fraction;
    }

    // 小数点以下がない、または特殊な分数でない場合は通常の数値を文字列で返す
    return units.toString();
};

export default function TimetableInterface({initialRawSchedules, user, lang = 'ja'}: {
    initialRawSchedules: FlatSchedule[],
    user?: User | null,
    lang?: string
}) {
    const {schedules, displaySchedules, toggleCourse, toggleVisibility, updateMemo} = useTimetable({
        initialSchedules: initialRawSchedules,
        initialCourseIds: Array.from(new Set(initialRawSchedules.map(s => s.courseId))),
        user
    });

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<FlatSchedule | null>(null);
    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

    // 翻訳
    const {t, isJa, currentLang} = useLanguage(lang);
    const translateDay = (day: string) => {
        // もし keys に 'days.mon' 形式で入れたなら `days.${day.toLowerCase()}`
        const key = `days.${day.toLowerCase()}` as keyof typeof ui['en'];
        return ui[currentLang][key] || day;
    };
    const translatePeriod = (label: string) => {
        if (label === '昼') return t('period.lunch');
        if (label === '夜') return t('period.night');
        return label;
    };

    const coursesInSelectedSlot = selectedSlot
        ? schedules.filter(s => s.dayOfWeek === selectedSlot.day && s.period === parseInt(selectedSlot.period))
        : [];

    const containerHeight = "100%";
    const minuteUnit = `calc((${containerHeight} - ${HEADER_HEIGHT}px) / ${END_TIME - START_TIME})`;
    const getTop = (min: number) => `calc((${min} - ${START_TIME}) * ${minuteUnit} + ${HEADER_HEIGHT}px)`;
    const getHeight = (duration: number) => `calc(${duration} * ${minuteUnit})`;

    const handleToggle = async (course: any) => {
        const cId = Number(course.courseId || course.id);
        if (isSubmitting === cId) return;
        setIsSubmitting(cId);
        try {
            await toggleCourse(course);
        } finally {
            setIsSubmitting(null);
        }
    };

    // 1. useEffectでステートを監視してモーダルを開閉する
    useEffect(() => {
        const modal = document.getElementById('course_detail_modal') as HTMLDialogElement;
        if (!modal) return;

        if (selectedSlot) {
            // すでに開いている場合は二重に呼ばないようにチェック
            if (!modal.open) modal.showModal();
        } else {
            if (modal.open) modal.close();
        }
    }, [selectedSlot]);

    // 2. クリックハンドラーはステートの更新だけにする
    const handleSlotClick = (day: string, p: any) => {
        const sMin = timeToMin(p.start);
        const nextP = PERIODS[PERIODS.indexOf(p) + 1];
        const visualEndMin = nextP ? timeToMin(nextP.start) : timeToMin(p.end);

        const isOccupied = displaySchedules.some(s =>
            s.dayOfWeek === day &&
            s.isVisible &&
            s.startMin < visualEndMin &&
            s.endMin > sMin
        );

        if (isOccupied) {
            // ステートをセットするだけ。開く処理は useEffect に任せる
            setSelectedSlot({day, period: p.label});
        }
    };

    // 3. 同様に single_course_modal もステートで管理
    useEffect(() => {
        const modal = document.getElementById('single_course_modal') as HTMLDialogElement;
        if (!modal) return;

        if (selectedCourse) { // CourseList内で定義しているステート
            if (!modal.open) modal.showModal();
        } else {
            if (modal.open) modal.close();
        }
    }, [selectedCourse]);

    const uniqueCourses = useMemo(() => {
        const seen = new Set();
        return schedules.filter(s => seen.has(s.courseId) ? false : seen.add(s.courseId));
    }, [schedules]);

    // isVisible が true の授業のみの単位合計を計算
    const visibleTotalUnits = useMemo(() => {
        return uniqueCourses
            .filter(c => c.isVisible)
            .reduce((sum, c) => sum + (c.units || 0), 0);
    }, [uniqueCourses]);

    //  --- 授業の概要 コースコード，言語，単位，タイトル，教員 ---
    const CourseHeader = ({ course, isJa, t }: { course: FlatSchedule, isJa: boolean, t: any }) => (
        <section className="flex flex-col gap-2">
            <div className="flex justify-between items-start text-[10px] sm:text-xs">
                <div className="flex flex-wrap gap-1.5 items-center">
                    <p className="badge badge-neutral badge-xs px-1.5 py-2 font-mono tracking-tighter">
                        {course.courseCode}
                    </p>
                    {course.language && (
                        <p className="badge badge-xs font-bold badge-outline text-base-content/50">
                            {course.language}
                        </p>
                    )}
                    {course.units > 0 && (
                        <p className="badge badge-outline badge-xs text-base-content/50">
                            {formatUnits(course.units)} {t('explore.units')}
                        </p>
                    )}
                </div>
            </div>
            <h1 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 mb-1">
                {isJa ? course.titleJa : course.titleEn}
            </h1>
            <h2 className="text-xs sm:text-sm text-base-content/60 truncate">
                {course.instructor}
            </h2>
        </section>
    );

    // --- 授業の詳細: メモ, シラバス，表示非表示，削除 ---
    const CourseDetailContent = ({
                                     course, t, toggleVisibility, handleToggle, isSubmitting, updateMemo
                                 }: {
        course: FlatSchedule,
        updateMemo: (c: FlatSchedule, memo: string) => void,
        t: any,
        toggleVisibility: (c: any) => void,
        handleToggle: (c: any) => void,
        isSubmitting: number | null
    }) => {
        const syllabusUrl = `https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${course.rgNo}&year=${course.year}&term=${seasonToNumber(course.term)}`;
        const cId = Number(course.courseId);

        return (
            <div className="flex flex-col gap-4 py-2">
                {/* メインアクション */}
                <div className="grid grid-cols-4 gap-2">
                    {/* シラバス (2/4 を占有) */}
                    <a href={syllabusUrl} target="_blank" rel="noreferrer"
                       className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300"
                       title={t('timetable.syllabus')}>
                        <SquareArrowOutUpRight size="16"/>
                        <span className="truncate">{t('timetable.syllabus')}</span>
                    </a>

                    {/* 表示/非表示 (1/4 を占有) */}
                    <button onClick={() => toggleVisibility(course)}
                            className={`btn btn-md gap-2 col-span-1 ${!course.isVisible ? 'btn-ghost border-base-300    ' : 'btn-neutral'}`}>
                        {course.isVisible ? <Eye size="18"/> : <EyeOff size="18"/>}
                    </button>

                    {/* 削除 (1/4 を占有) */}
                    <button onClick={() => handleToggle(course)}
                            disabled={isSubmitting === cId}
                            className="btn btn-md btn-error col-span-1 gap-2">
                        {isSubmitting === cId ? (
                            <span className="loading loading-spinner loading-xs"/>
                        ) : (
                            <Trash2 size="18"/>
                        )}
                    </button>
                </div>

                {/* メモ */}
                <div className="form-control w-full">
                    <label className="label pt-0">
                    <span className="label-text flex items-center gap-2 font-bold opacity-70">
                        <StickyNote size="14"/> {t('timetable.memo')}
                    </span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full h-24 text-sm focus:textarea-primary"
                        placeholder="課題や教室のメモ..."
                        defaultValue={course.memo || ""}
                        onBlur={(e) => updateMemo(course, e.target.value)} // フォーカスが外れた時に保存
                    ></textarea>
                </div>
            </div>
        );
    };

    const CourseList = ({items, padding = true}: { items: FlatSchedule[], padding?: boolean }) => {
        return (
            <div className={`flex flex-col gap-2 w-full ${padding ? 'p-2' : ''}`}>
                {items.map(course => {
                    const cId = Number(course.courseId);
                    return (
                        <div key={course.courseId}
                             className={`group p-3 bg-base-100 rounded-xl flex justify-between items-center border border-base-300 hover:border-primary/50 transition-all ${!course.isVisible ? "opacity-60" : ""}`}>

                            {/* 左側：クリックで詳細モーダルへ */}
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                                setSelectedCourse(course);
                                (document.getElementById('single_course_modal') as HTMLDialogElement)?.showModal();
                            }}>
                                <CourseHeader course={course} isJa={isJa} t={t} />
                            </div>

                            {/* 右側：最小限のクイック操作のみ残す */}
                            <div className="flex gap-1 shrink-0 ml-2">
                                <button onClick={() => toggleVisibility(course)}
                                        className="btn btn-sm btn-square btn-ghost border-base-300">
                                    {course.isVisible ? <Eye size="14"/> : <EyeOff size="14" className="text-error"/>}
                                </button>
                                <button onClick={() => handleToggle(course)}
                                        disabled={isSubmitting === cId}
                                        className="btn btn-sm btn-square btn-error">
                                    {isSubmitting === cId ? <span className="loading loading-spinner loading-xs"/> :
                                        <Trash2 size="14"/>}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="text-center py-10 opacity-50 text-sm">{t('timetable.no_courses')}</div>
                )}
            </div>
        );
    };

    const TimetableGrid = () => (
        <div className="flex w-full bg-base-100 border-b border-base-content/20 h-full"
             style={{height: "100%"}}>
            {/* 時刻軸 (左端のカラム) */}
            <div className="w-10 border-l border-r border-base-content/50 relative shrink-0 bg-base-100 z-20">
                <div style={{height: HEADER_HEIGHT}} className="border-b border-base-content/50"/>
                {PERIODS.map(p => {
                    const sMin = timeToMin(p.start);
                    return (
                        <div key={p.label}
                             className="absolute w-full flex flex-col items-center border-t border-base-content/50"
                             style={{top: getTop(sMin)}}>
                            <span className="text-[9px] opacity-60 leading-none mt-1">{p.start}</span>
                            <span className="font-bold text-xs mx-auto">{translatePeriod(p.label)}</span>
                        </div>
                    );
                })}
            </div>

            {/* 曜日カラム内 */}
            {SELECTABLE_DAYS.map(day => (
                <div key={day} className="flex-1 border-r border-base-content/50 relative h-full bg-base-100">

                    {/* 曜日ヘッダー */}
                    <div
                        className="text-center border-b border-base-content/50 text-xs font-bold bg-base-100 z-10 relative flex items-center justify-center"
                        style={{height: HEADER_HEIGHT}}>
                        {translateDay(day)}
                    </div>

                    {/* 背景スロット: 次のコマの開始時間まで広げて描画 */}
                    {PERIODS.map((p, index) => {
                        const sMin = timeToMin(p.start);
                        const nextP = PERIODS[index + 1];
                        // 次のコマがあればその開始時刻まで、なければ自分の終了時刻まで
                        const visualEndMin = nextP ? timeToMin(nextP.start) : timeToMin(p.end);
                        const isOccupied = displaySchedules.some(s =>
                            s.dayOfWeek === day &&
                            s.isVisible && // 表示されているもののみ
                            // 授業の開始がスロット終了より前、かつ授業の終了がスロット開始より後
                            s.startMin < visualEndMin &&
                            s.endMin > sMin
                        );
                        return (
                            <div
                                key={`slot-${p.label}`}
                                className={`absolute w-full border-t border-base-content/5 ${
                                    isOccupied
                                        ? "z-30 cursor-pointer pointer-events-auto"
                                        : "z-0 pointer-events-none opacity-20"
                                }`}
                                style={{
                                    top: getTop(sMin),
                                    height: getHeight(visualEndMin - sMin),
                                }}
                                onClick={() => isOccupied && handleSlotClick(day, p)}
                            />
                        );
                    })}

                    {/* 授業カード: 実際の授業時間 (10分休みを含まない) で描画 */}
                    {displaySchedules.filter(s => s.dayOfWeek === day).map((sched, i) => (
                        <div key={`${sched.courseCode}-${i}`}
                             className="card absolute z-10 overflow-hidden shadow-sm rounded-sm bg-primary border border-primary/20"
                             style={{
                                 top: getTop(sched.startMin),
                                 height: getHeight(sched.endMin - sched.startMin),
                                 left: `${(sched.col * 100) / sched.groupMaxCols}%`,
                                 width: `calc(${(100 / sched.groupMaxCols)}% - 1px)`,
                             }}>
                            <div className="text-primary-content pointer-events-none">
                                <p className="lg:text-xs text-[10px] font-normal">{sched.courseCode}</p>
                                <h1 className="lg:text-md text-xs font-bold line-clamp-1 leading-tight">
                                   {isJa ? sched.titleJa : sched.titleEn}
                                </h1>
                                <h2 className="lg:text-xs text-[10px]">{user && sched.room}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    const currentSelectedCourse = useMemo(() => {
        if (!selectedCourse) return null;
        return schedules.find(s => s.courseId === selectedCourse.courseId) || selectedCourse;
    }, [selectedCourse, schedules]);

    return (
        <section className="flex flex-col w-full select-none h-full relative overflow-hidden">
            {/* 1. 左側：表示モード切り替え (Grid/List) */}
            <div
                className="lg:hidden fixed bottom-6 left-6 z-50 flex bg-base-100/80 backdrop-blur-md shadow-lg rounded-2xl border border-base-300 p-1.5 gap-1">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`btn btn-md btn-square rounded-xl no-animation ${
                        viewMode === 'grid' ? 'btn-primary shadow-sm' : 'btn-ghost'
                    }`}
                    title={t('timetable.title')}
                >
                    <LayoutGrid size={18}/>
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`btn btn-md btn-square rounded-xl no-animation ${
                        viewMode === 'list' ? 'btn-primary shadow-sm' : 'btn-ghost'
                    }`}
                    title={t('timetable.list_view')}
                >
                    <List size={18}/>
                </button>
            </div>

            {/* フローティング単位表示バッジ */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 pointer-events-none">
                <div
                    className="bg-neutral text-neutral-content px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-3 backdrop-blur-md bg-opacity-80 transition-all duration-300">
                    <span className="text-lg font-mono font-black">
                        {formatDisplayUnits(visibleTotalUnits)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
                        {t('timetable.units')}
                    </span>
                </div>
            </div>

            {/* メインコンテンツエリア */}
            <div className="flex-1 overflow-hidden relative">

                {/* モバイル表示：useStateの値で出し分け */}
                <div className="lg:hidden h-full w-full">
                    {viewMode === 'grid' ? (
                        <div className="h-full w-full">
                            <TimetableGrid/>
                        </div>
                    ) : (
                        <div className="h-full w-full overflow-y-auto">
                            <CourseList items={uniqueCourses}/>
                        </div>
                    )}
                </div>

                {/* 3. PC用 2カラム*/}
                <div className="hidden lg:flex h-full overflow-hidden border-t border-base-300">
                    <aside className="w-80 flex flex-col bg-base-200/20 border-r border-base-300">
                        <div className="flex-1 overflow-y-auto">
                            <CourseList items={uniqueCourses}/>
                        </div>
                    </aside>
                    <main className="flex-1 overflow-hidden bg-base-100">
                        <TimetableGrid/>
                    </main>
                </div>
            </div>

            {/* 詳細モーダル */}
            <dialog id="course_detail_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box p-6">
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">
                        {isJa ? `${translateDay(selectedSlot?.day || "")} ${selectedSlot?.period}限` : `${translateDay(selectedSlot?.day || "")} Period ${selectedSlot?.period}`}
                    </h3>

                    <div className="space-y-4">
                        {coursesInSelectedSlot.length === 1 ? (
                            // --- 1つの場合：即座に詳細を表示 ---
                            <section className="flex flex-col gap-2">
                                <div className="mb-2 border-b pb-4">
                                    <CourseHeader course={coursesInSelectedSlot[0]} isJa={isJa} t={t} />
                                </div>
                                <CourseDetailContent
                                    course={coursesInSelectedSlot[0]}
                                    t={t}
                                    updateMemo={updateMemo}
                                    toggleVisibility={toggleVisibility}
                                    handleToggle={handleToggle}
                                    isSubmitting={isSubmitting}
                                />
                            </section>
                        ) : (
                            // --- 複数の場合：アコーディオン ---
                            <div className="flex flex-col gap-2">
                                {coursesInSelectedSlot.map((c) => {
                                    const isExpanded = expandedCourseId === c.courseId;
                                    return (
                                        <div
                                            key={c.courseId}
                                            className={`collapse collapse-arrow bg-base-200/50 border border-base-300
                                             ${isExpanded ? 'collapse-open' : 'collapse-close'}`}>
                                            <div
                                                className="flex flex-col gap-2 collapse-title pr-10 cursor-pointer active:bg-base-300/50"
                                                onClick={() => setExpandedCourseId(isExpanded ? null : c.courseId)}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                    <CourseHeader course={c} isJa={isJa} t={t} />
                                            </div>

                                            {/* 内容部分 */}
                                            <div className="collapse-content border-t border-base-300 bg-base-100 px-0">
                                                <div className="p-4">
                                                    <CourseDetailContent
                                                        course={c}
                                                        t={t}
                                                        updateMemo={updateMemo}
                                                        toggleVisibility={toggleVisibility}
                                                        handleToggle={handleToggle}
                                                        isSubmitting={isSubmitting}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <form method="dialog" className="mt-6">
                        <button className="btn btn-block" onClick={() => setSelectedSlot(null)}>閉じる</button>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop bg-black/60">
                    <button onClick={() => setSelectedSlot(null)}>close</button>
                </form>
            </dialog>

            {/* --- 個別授業詳細モーダル --- */}
            <dialog id="single_course_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                                onClick={() => setSelectedCourse(null)}>✕
                        </button>
                    </form>
                    {currentSelectedCourse && (
                        <section className="flex flex-col gap-2">
                            <div className="mb-2 border-b pb-4">
                                <CourseHeader course={currentSelectedCourse} isJa={isJa} t={t} />
                            </div>
                            <CourseDetailContent
                                course={currentSelectedCourse}
                                t={t}
                                updateMemo={updateMemo}
                                toggleVisibility={toggleVisibility}
                                handleToggle={handleToggle}
                                isSubmitting={isSubmitting}
                            />
                        </section>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop bg-black/60">
                    <button onClick={() => setSelectedCourse(null)}>close</button>
                </form>
            </dialog>
        </section>
    );
}
