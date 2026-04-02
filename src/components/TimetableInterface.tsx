import type {FlatSchedule} from "@/db/schema.ts";
import {END_TIME, PERIODS, SELECTABLE_DAYS, START_TIME} from "@/constants/time.ts";
import type {User} from "better-auth";
import {timeToMin} from "@/lib/timetable.ts";
import {useTimetable} from "@/lib/useTimetable.ts";
import {useEffect, useMemo, useState} from "react";
import {Eye, EyeOff, LayoutGrid, List, SquareArrowOutUpRight, StickyNote, X} from "lucide-react"; // アイコン追加
import {ui} from "@/translation/ui.ts";
import {useLanguage} from "@/translation/utils.ts";
import {formatUnits} from "@/components/ExploreInterface.tsx";

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
    const {t, isJa, currentLang} = useLanguage(lang);
    const {schedules, displaySchedules, toggleCourse, toggleVisibility} = useTimetable({
        initialSchedules: initialRawSchedules,
        initialCourseIds: Array.from(new Set(initialRawSchedules.map(s => s.courseId))),
        user
    });

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    // 曜日を翻訳するヘルパー
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

    useEffect(() => {
        if (selectedSlot && coursesInSelectedSlot.length === 0) {
            (document.getElementById('course_detail_modal') as HTMLDialogElement)?.close();
            setSelectedSlot(null);
        }
    }, [coursesInSelectedSlot.length, selectedSlot]);

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

    const handleSlotClick = (day: string, p: any) => { // p を PERIOD オブジェクトとして受ける
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
            // period は表示上のラベルとしてセット
            setSelectedSlot({day, period: p.label});
            (document.getElementById('course_detail_modal') as HTMLDialogElement)?.showModal();
        }
    };

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

    // 共通のカードリストコンポーネント
    const CourseList = ({items, padding = true}: { items: FlatSchedule[], padding?: boolean }) => {
        // 各コースのメモ開閉状態を管理 (IDをキーにする)
        const [openMemos, setOpenMemos] = useState<Record<number, boolean>>({});

        const toggleMemo = (cId: number) => {
            setOpenMemos(prev => ({...prev, [cId]: !prev[cId]}));
        };

        return (
            <div className={`flex flex-col gap-2 w-full ${padding ? 'p-2' : ''}`}>
                {items.map(course => {
                    const cId = Number(course.courseId);
                    const isMemoOpen = openMemos[cId];

                    return (
                        <div
                            key={course.courseId}
                            className={`p-3 bg-base-100 rounded-xl border border-base-300 transition-all ${!course.isVisible ? "opacity-60" : ""}`}
                        >
                            <div className="flex justify-between items-start">
                                {/* 左側：科目情報 */}
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-mono bg-base-300 px-1 rounded">
                                        {course.courseCode}
                                    </span>
                                    </div>
                                    <div className="font-bold truncate text-sm">
                                        {isJa ? course.titleJa : course.titleEn}
                                    </div>
                                    <div className="text-[11px] opacity-60 truncate">
                                        {course.instructor} • {formatUnits(course.units)} Units
                                    </div>
                                </div>

                                {/* 右側：2段アイコンボタン */}
                                <div className="flex flex-col gap-1 shrink-0">
                                    {/* 上段：外部・表示系 */}
                                    <div className="flex gap-1">
                                        <a target='_blank' rel="noreferrer"
                                           href={`https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${course.rgNo}&year=${course.year}&term=${seasonToNumber(course.term)}`}
                                           className="btn btn-xs btn-square btn-ghost border-base-300"
                                           title={t('timetable.syllabus')}>
                                            <SquareArrowOutUpRight size="14"/>
                                        </a>
                                        <button
                                            onClick={() => toggleVisibility(course)}
                                            className="btn btn-xs btn-square btn-ghost border-base-300"
                                        >
                                            {course.isVisible ? <Eye size="14"/> :
                                                <EyeOff size="14" className="text-error"/>}
                                        </button>
                                    </div>

                                    {/* 下段：編集・削除系 */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => toggleMemo(cId)}
                                            className={`btn btn-xs btn-square border-base-300 ${isMemoOpen ? 'btn-primary' : 'btn-ghost'}`}
                                        >
                                            <StickyNote size="14"/>
                                        </button>
                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={isSubmitting === cId}
                                            className="btn btn-xs btn-square btn-error"
                                        >
                                            {isSubmitting === cId ? (
                                                <span className="loading loading-spinner loading-xs"/>
                                            ) : (
                                                <X size="14"/>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* メモ入力エリア：表示フラグが立っている時だけ展開 */}
                            {isMemoOpen && (
                                <div className="mt-3 pt-3 border-t border-dashed border-base-300">
                                <textarea
                                    className="textarea textarea-bordered textarea-xs w-full leading-tight focus:textarea-primary"
                                    placeholder="Memo (Room, Task, etc...)"
                                    rows={2}
                                    autoFocus
                                />
                                </div>
                            )}
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
                                className={`absolute w-full border-t border-base-content/5 transition-colors ${
                                    isOccupied
                                        ? "z-30 cursor-pointer hover:bg-primary/10 pointer-events-auto"
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
                                <h1 className="text-xs line-clamp-2 leading-tight">
                                    <span
                                        className="font-bold">{sched.courseCode} </span> {isJa ? sched.titleJa : sched.titleEn}
                                </h1>
                                <h2 className="text-[10px]">{user && sched.room}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

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
                <div className="modal-box p-0 pt-6 max-w-lg flex flex-col">
                    <h3 className="font-bold text-lg px-6 mb-2">
                        {isJa
                            ? `${translateDay(selectedSlot?.day || "")}${selectedSlot?.period}${t('timetable.modal_title')}`
                            : `${t('timetable.modal_title')} ${translateDay(selectedSlot?.day || "")} ${selectedSlot?.period}`
                        }
                    </h3>
                    <div className="overflow-y-auto flex-1 px-4">
                        <CourseList items={coursesInSelectedSlot} padding={false}/>
                    </div>
                    <div className="p-4 bg-base-100 border-t border-base-200">
                        <form method="dialog">
                            <button className="btn btn-block" onClick={() => setSelectedSlot(null)}>
                                {t('timetable.close')}
                            </button>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop bg-black/60">
                    <button onClick={() => setSelectedSlot(null)}>close</button>
                </form>
            </dialog>
        </section>
    );
}