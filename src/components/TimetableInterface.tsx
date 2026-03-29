import type {FlatSchedule} from "@/db/schema.ts";
import {END_TIME, PERIODS, START_TIME} from "@/constants/time.ts";
import type {User} from "better-auth";
import {timeToMin} from "@/lib/timetable.ts";
import {useTimetable} from "@/lib/useTimetable.ts";

const HEADER_HEIGHT = 40;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ProcessedSchedule extends FlatSchedule {
    startMin: number;
    displayEndMin: number;
    col: number;
    groupMaxCols: number;
}

export interface TimetableProps {
    processedSchedules: ProcessedSchedule[];
    user?: User | null;
}


export default function TimetableInterface({processedSchedules, user}: TimetableProps) {
    const {schedules} = useTimetable({
        initialSchedules: processedSchedules,
        initialCourseIds: Array.from(new Set(processedSchedules.map(s => s.courseId))),
        user
    });

    const containerHeight = "calc(100vh - 140px)";

    const minuteUnit = `calc((${containerHeight} - ${HEADER_HEIGHT}px) / ${END_TIME - START_TIME})`;

    const timeStyle = (start: number, end?: number) => ({
        top: `calc(${start} * ${minuteUnit} + ${HEADER_HEIGHT}px)`,
        height: end ? `calc(${end - start} * ${minuteUnit})` : undefined
    });

    return (
        <div className="flex w-full overflow-hidden bg-base-100 border-t border-b select-none"
             style={{height: containerHeight, minHeight: '-webkit-fill-available'}}>

            {/* 時刻軸 */}
            <div className="w-10 border-l border-r relative shrink-0">
                <div style={{height: HEADER_HEIGHT}} className="border-b"/>
                {PERIODS.map(p => (
                    <div key={p.label}
                         className="absolute w-full flex flex-col items-center border-t"
                         style={timeStyle(timeToMin(p.start), timeToMin(p.end))}>
                        <span className="text-[9px] opacity-50 mt-0.5">{p.start}</span>
                        <span className="font-bold text-xs m-auto">{p.label}</span>
                    </div>
                ))}
            </div>

            {/* 各曜日のカラム */}
            {DAYS.map(day => (
                <div key={day} className="flex-1 border-r border-b relative h-full">
                    {/* 背景グリッド */}
                    {PERIODS.map(p => (
                        <div key={`grid-${p.label}`} className="absolute w-full border-t"
                             style={timeStyle(timeToMin(p.start), timeToMin(p.end))}/>
                    ))}

                    {/* 曜日ヘッダー */}
                    <div className="text-center border-b text-xs font-bold bg-base-100 z-20 relative"
                         style={{height: HEADER_HEIGHT}}>
                        {day}
                    </div>

                    {/* 授業のコマ */}
                    {schedules.filter(s => s.dayOfWeek === day).map((sched, i) => (
                        <div
                            key={`${sched.courseCode}-${i}`}
                            className="card card-border absolute z-10 overflow-hidden bg-base-100 shadow-sm border rounded-sm select-none"
                            style={{
                                ...timeStyle(sched.startMin, sched.displayEndMin),
                                left: `${(sched.col * 100) / sched.groupMaxCols}%`,
                                width: `calc(${(100 / sched.groupMaxCols)}% - 1px)`,
                            }}
                        >
                            <div className="p-0.5 h-full flex flex-col justify-center items-center">
                                <h1 className="text-sm font-bold line-clamp-2 leading-tight  break-all px-0.5">
                                    {sched.titleJa}
                                </h1>
                                <p className="text-xs line-clamp-1">{sched.startTime}-{sched.endTime}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}