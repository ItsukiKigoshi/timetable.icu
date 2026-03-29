import type {FlatSchedule} from "@/db/schema.ts";
import {END_TIME, PERIODS, SELECTABLE_DAYS, START_TIME} from "@/constants/time.ts";
import type {User} from "better-auth";
import {timeToMin} from "@/lib/timetable.ts";
import {useTimetable} from "@/lib/useTimetable.ts";
import {useEffect, useState} from "react"; // useEffectを追加

const HEADER_HEIGHT = 40;

export default function TimetableInterface({initialRawSchedules, user}: {
    initialRawSchedules: FlatSchedule[],
    user?: User | null
}) {
    const {schedules, displaySchedules, toggleCourse} = useTimetable({
        initialSchedules: initialRawSchedules,
        initialCourseIds: Array.from(new Set(initialRawSchedules.map(s => s.courseId))),
        user
    });

    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

    // モーダルに表示すべき授業を計算
    const coursesInSelectedSlot = selectedSlot
        ? schedules.filter(s => s.dayOfWeek === selectedSlot.day && s.period === parseInt(selectedSlot.period))
        : [];

    // ★ 追加: 要素が0になったら自動で閉じる処理
    useEffect(() => {
        if (selectedSlot && coursesInSelectedSlot.length === 0) {
            const modal = document.getElementById('course_detail_modal') as HTMLDialogElement;
            if (modal) {
                modal.close();
                setSelectedSlot(null); // 状態もクリア
            }
        }
    }, [coursesInSelectedSlot.length, selectedSlot]);

    const containerHeight = "calc(100vh - 140px)";
    const minuteUnit = `calc((${containerHeight} - ${HEADER_HEIGHT}px) / ${END_TIME - START_TIME})`;

    const timeStyle = (start: number, end?: number) => ({
        top: `calc(${start} * ${minuteUnit} + ${HEADER_HEIGHT}px)`,
        height: end ? `calc(${end - start} * ${minuteUnit})` : undefined
    });

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
        <div className="flex w-full overflow-hidden bg-base-100 border-t border-b select-none"
             style={{height: containerHeight}}>
            {/* 時刻軸 */}
            <div className="w-10 border-l border-r relative shrink-0">
                <div style={{height: HEADER_HEIGHT}} className="border-b"/>
                {PERIODS.map(p => (
                    <div key={p.label} className="absolute w-full flex flex-col items-center border-t"
                         style={timeStyle(timeToMin(p.start), timeToMin(p.end))}>
                        <span className="text-[9px] opacity-50 mt-0.5">{p.start}</span>
                        <span className="font-bold text-xs m-auto">{p.label}</span>
                    </div>
                ))}
            </div>

            {/* 曜日カラム */}
            {SELECTABLE_DAYS.map(day => (
                <div key={day} className="flex-1 border-r relative h-full bg-base-100">
                    {/* 背景スロット */}
                    {PERIODS.map(p => {
                        const isOccupied = schedules.some(s => s.dayOfWeek === day && s.period === parseInt(p.label));
                        return (
                            <div
                                key={`slot-${p.label}`}
                                className={`absolute w-full border-t border-base-200 z-0 transition-colors ${isOccupied ? "cursor-pointer hover:bg-primary/5" : ""}`}
                                style={timeStyle(timeToMin(p.start), timeToMin(p.end))}
                                onClick={() => handleSlotClick(day, p.label)}
                            />
                        );
                    })}

                    {/* 授業カード */}
                    {displaySchedules.filter(s => s.dayOfWeek === day).map((sched, i) => (
                        <div
                            key={`${sched.courseCode}-${i}`}
                            className="card absolute z-10 overflow-hidden shadow-sm border rounded-sm border-primary/30 bg-base-100 pointer-events-none"
                            style={{
                                ...timeStyle(sched.startMin, sched.displayEndMin),
                                left: `${(sched.col * 100) / sched.groupMaxCols}%`,
                                width: `calc(${(100 / sched.groupMaxCols)}% - 1px)`,
                            }}
                        >
                            <div className="absolute inset-0 bg-primary/10"/>
                            <div
                                className="relative p-0.5 h-full flex flex-col justify-center items-center text-center">
                                <h1 className="text-[10px] sm:text-xs font-bold line-clamp-2 text-primary leading-tight">
                                    {sched.titleJa}
                                </h1>
                            </div>
                        </div>
                    ))}

                    <div
                        className="text-center border-b text-xs font-bold bg-base-100 z-30 relative pointer-events-none flex items-center justify-center shadow-sm"
                        style={{height: HEADER_HEIGHT}}>
                        {day}
                    </div>
                </div>
            ))}

            {/* 授業詳細・削除モーダル */}
            <dialog id="course_detail_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{selectedSlot?.day} {selectedSlot?.period}限の授業</h3>
                    <div className="py-4 space-y-3">
                        {coursesInSelectedSlot.map((course) => {
                            const cId = Number(course.courseId || (course as any).id);
                            return (
                                <div key={cId}
                                     className="p-4 bg-base-200 rounded-xl flex justify-between items-center border border-base-300">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-bold truncate text-sm">{course.titleJa}</div>
                                        <div className="text-xs opacity-60 truncate">{course.instructor}</div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggle(course)}
                                            disabled={isSubmitting === cId}
                                            className="btn btn-sm btn-error btn-outline"
                                        >
                                            {isSubmitting === cId ?
                                                <span className="loading loading-spinner loading-xs"/> : "削除"}
                                        </button>
                                        <a href={`/course/${cId}`} className="btn btn-sm btn-ghost">詳細</a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn w-full" onClick={() => setSelectedSlot(null)}>閉じる</button>
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