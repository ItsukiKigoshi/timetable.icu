import type {DisplaySchedule} from "@/lib/timetable/utils.ts";
import {TIMETABLE_CONFIG, timeToMin} from "@/lib/timetable/utils.ts";
import {PERIODS, SELECTABLE_DAYS} from "@/constants/time.ts";

interface TimetableGridProps {
    // 1. データ (事前計算済みのスタイルを含む)
    displaySchedules: DisplaySchedule[];
    user: any;

    // 2. 状態・ユーティリティ
    isJa: boolean;
    translateDay: (day: string) => string;
    translatePeriod: (p: string) => string;

    // 3. ハンドラー
    handleSlotClick: (day: string, p: any) => void;

    // 4. 定数
    headerHeight: number;
}

export const TimetableGrid = ({
                                  displaySchedules,
                                  user,
                                  isJa,
                                  translateDay,
                                  translatePeriod,
                                  handleSlotClick,
                                  headerHeight
                              }: TimetableGridProps) => {

    // 背景スロット用の補助関数 (これらは Grid 内部で完結させる)
    const getSlotTop = (min: number) =>
        (min - timeToMin(TIMETABLE_CONFIG.START_TIME)) * TIMETABLE_CONFIG.MINUTE_HEIGHT + headerHeight;

    const getSlotHeight = (duration: number) =>
        duration * TIMETABLE_CONFIG.MINUTE_HEIGHT;

    return (
        <div className="flex w-full bg-base-100 border-b border-base-content/20 h-full">

            {/* 時刻軸 (左端のカラム) */}
            <div className="w-10 border-l border-r border-base-content/50 relative shrink-0 bg-base-100 z-20">
                <div style={{ height: headerHeight }} className="border-b border-base-content/50" />
                {PERIODS.map(p => (
                    <div key={p.label}
                         className="absolute w-full flex flex-col items-center border-t border-base-content/50"
                         style={{ top: getSlotTop(timeToMin(p.start)) }}>
                        <span className="text-[9px] opacity-60 leading-none mt-1">{p.start}</span>
                        <span className="font-bold text-xs mx-auto">{translatePeriod(p.label)}</span>
                    </div>
                ))}
            </div>

            {/* 曜日カラム */}
            {SELECTABLE_DAYS.map(day => (
                <div key={day} className="flex-1 border-r border-base-content/50 relative h-full bg-base-100">

                    {/* 曜日ヘッダー */}
                    <div className="text-center border-b border-base-content/50 text-xs font-bold bg-base-100 z-10 relative flex items-center justify-center"
                         style={{ height: headerHeight }}>
                        {translateDay(day)}
                    </div>

                    {/* 背景スロット (クリック判定用) */}
                    {PERIODS.map((p, index) => {
                        const sMin = timeToMin(p.start);
                        const nextP = PERIODS[index + 1];
                        const visualEndMin = nextP ? timeToMin(nextP.start) : timeToMin(p.end);

                        const isOccupied = displaySchedules.some(s =>
                            s.dayOfWeek === day &&
                            s.isVisible &&
                            s.startMin < visualEndMin &&
                            s.endMin > sMin
                        );

                        return (
                            <div key={`slot-${p.label}`}
                                 className={`absolute w-full border-t border-base-content/5 ${
                                     isOccupied ? "z-30 cursor-pointer pointer-events-auto" : "z-0 pointer-events-none opacity-20"
                                 }`}
                                 style={{
                                     top: getSlotTop(sMin),
                                     height: getSlotHeight(visualEndMin - sMin),
                                 }}
                                 onClick={() => isOccupied && handleSlotClick(day, p)}
                            />
                        );
                    })}

                    {/* 授業カード */}
                    {displaySchedules.filter(s => s.dayOfWeek === day).map((sched, i) => (
                        <div key={`${sched.courseCode}-${i}`}
                             className="card absolute z-10 overflow-hidden shadow-sm rounded-sm bg-primary border border-primary/20"
                             style={{
                                 top: sched.style.top,
                                 height: sched.style.height,
                                 left: sched.style.left,
                                 width: sched.style.width,
                             }}>
                            <div className="text-primary-content p-1 pointer-events-none">
                                <p className="lg:text-xs text-[10px] font-normal opacity-90">{sched.courseCode}</p>
                                <h1 className="lg:text-sm text-[11px] font-bold line-clamp-2 leading-tight">
                                    {isJa ? sched.titleJa : sched.titleEn}
                                </h1>
                                {user && sched.room && (
                                    <p className="lg:text-[10px] text-[9px] mt-0.5 truncate italic opacity-80">
                                        {sched.room}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};