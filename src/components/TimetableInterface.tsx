import type {FlatSchedule} from "@/db/schema.ts";
import {END_TIME, PERIODS, SELECTABLE_DAYS, START_TIME} from "@/constants/time.ts";
import type {User} from "better-auth";
import {timeToMin} from "@/lib/timetable.ts";
import {useTimetable} from "@/lib/useTimetable.ts";
import {useEffect, useState} from "react";
import {SquareArrowOutUpRight, X} from "lucide-react";
import {ui} from "@/translation/ui.ts";
import {useLanguage} from "@/translation/utils.ts";

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
    // 翻訳セットアップ
    const {t, isJa, currentLang} = useLanguage(lang);

    // 曜日を翻訳するヘルパー
    const translateDay = (day: string) => {
        // もし keys に 'days.mon' 形式で入れたなら `days.${day.toLowerCase()}`
        const key = `days.${day.toLowerCase()}` as keyof typeof ui['en'];
        return ui[currentLang][key] || day;
    };

    const translatePeriod = (label: string) => {
        if (label === '昼') return t('period.lunch');
        if (label === '夜') return t('period.night');
        return label; // 1, 2, 3... はそのまま
    };

    const {schedules, displaySchedules, toggleCourse} = useTimetable({
        initialSchedules: initialRawSchedules,
        initialCourseIds: Array.from(new Set(initialRawSchedules.map(s => s.courseId))),
        user
    });

    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    // --- 合計単位数の計算ロジック ---
    const totalUnits = Array.from(
        new Map(schedules.map(s => [s.courseId, s.units])).values()
    ).reduce((sum, u) => sum + (u || 0), 0);

    // モーダルに表示すべき授業を計算
    const coursesInSelectedSlot = selectedSlot
        ? schedules.filter(s => s.dayOfWeek === selectedSlot.day && s.period === parseInt(selectedSlot.period))
        : [];

    // ★ 要素が0になったら自動で閉じる処理
    useEffect(() => {
        if (selectedSlot && coursesInSelectedSlot.length === 0) {
            const modal = document.getElementById('course_detail_modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
                setSelectedSlot(null); // 状態もクリア
            }
        }
    }, [coursesInSelectedSlot.length, selectedSlot]);

    const containerHeight = "calc(100vh - 150px)";
    const minuteUnit = `calc((${containerHeight} - ${HEADER_HEIGHT}px) / ${END_TIME - START_TIME})`;

    // ヘルパー: START_TIME(525) からの差分をピクセル座標に変換
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

    const handleSlotClick = (day: string, periodLabel: string) => {
        const hasCourse = schedules.some(s => s.dayOfWeek === day && s.period === parseInt(periodLabel));
        if (hasCourse) {
            setSelectedSlot({day, period: periodLabel});
            const modal = document.getElementById('course_detail_modal') as HTMLDialogElement;
            modal?.showModal();
        }
    };

    return (
        <div className="flex flex-col w-full select-none">
            {/*単位数*/}
            <div
                className="flex items-center justify-center my-1 backdrop-blur-sm shrink-0">
                <span className="text-sm font-bold text-base-content">
                    {formatDisplayUnits(totalUnits)} {t('timetable.units')}
                </span>
            </div>

            {/* タイムテーブル本体 */}
            <div className="flex w-full overflow-hidden bg-base-100 border-t border-b border-base-content/50 "
                 style={{height: containerHeight}}>

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

                            const isOccupied = schedules.some(s => s.dayOfWeek === day && s.period === parseInt(p.label));

                            return (
                                <div
                                    key={`slot-${p.label}`}
                                    className={`absolute w-full border-t border-base-content/10 z-0 transition-colors
                                    ${isOccupied
                                        ? "z-20 cursor-pointer hover:bg-primary/10" // 授業があるときは最前面へ
                                        : "z-0 pointer-events-none opacity-50"// ないときは沈める
                                    }`}
                                    style={{
                                        top: getTop(sMin),
                                        height: getHeight(visualEndMin - sMin),
                                    }}
                                    onClick={() => isOccupied && handleSlotClick(day, p.label)}
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
                                <div className="p-1.5 text-primary-content pointer-events-none">
                                    <p className="text-[10px] opacity-80">{sched.startTime}</p>
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

            {/* 授業詳細モーダル */}
            <dialog id="course_detail_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">
                        {/* ★ モーダルタイトルの構成 */}
                        {isJa
                            ? `${translateDay(selectedSlot?.day || "")}${selectedSlot?.period}${t('timetable.modal_title')}`
                            : `${t('timetable.modal_title')} ${translateDay(selectedSlot?.day || "")} ${selectedSlot?.period}`
                        }
                    </h3>

                    <div className="py-4 space-y-3">
                        {coursesInSelectedSlot.map((course) => {
                            const cId = Number(course.courseId || (course as any).id);
                            return (
                                <div key={cId}
                                     className="p-4 bg-base-200 rounded-xl flex justify-between items-center border border-base-300">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-bold truncate text-sm">
                                            {isJa ? course.titleJa : course.titleEn}
                                        </div>
                                        <div className="text-xs opacity-60 truncate">{course.instructor}</div>
                                    </div>

                                    {/* 右側のボタンエリアを垂直方向のflexに変更 */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <a target='_blank'
                                           href={`https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?regno=${course.rgNo}&year=${course.year}&term=${seasonToNumber(course.term)}`}
                                           className="btn btn-sm">
                                            <span>{t('timetable.syllabus')}</span>
                                            <SquareArrowOutUpRight size="14"/>
                                        </a>

                                        {/* 非表示/表示ボタン (削除ボタンの上) */}
                                        <button
                                            onClick={() => {/* toggleVisibility(course) */
                                            }}
                                            className="btn btn-sm btn-ghost border-base-300 gap-1.5"
                                        >
                                            {/* isVisibleの値によって翻訳を出し分け */}
                                            <span className="font-bold">
                                                {course.isVisible ? t('timetable.hide') : t('timetable.show')}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={isSubmitting === cId}
                                            className="btn btn-sm btn-error gap-1.5"
                                        >
                                            {isSubmitting === cId ? (
                                                <span className="loading loading-spinner loading-xs"/>
                                            ) : (
                                                <>
                                                    <span className="font-bold">{t('timetable.remove')}</span>
                                                    <X size="14"/>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn w-full" onClick={() => setSelectedSlot(null)}>
                                {t('timetable.close')}
                            </button>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setSelectedSlot(null)}>close</button>
                </form>
            </dialog>
        </div>
    );
}