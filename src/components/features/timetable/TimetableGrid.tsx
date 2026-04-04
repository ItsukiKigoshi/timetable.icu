import type {DisplaySchedule} from "@/lib/timetable/utils.ts";
import {timeToMin} from "@/lib/timetable/utils.ts";
import {PERIODS, SELECTABLE_DAYS, TIMETABLE_CONFIG} from "@/constants/time.ts";

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
}

const TimetableGrid = ({
                                  displaySchedules,
                                  user,
                                  isJa,
                                  translateDay,
                                  translatePeriod,
                                  handleSlotClick,
                              }: TimetableGridProps) => {

    const containerHeight = "100%";
    const minuteUnit = `calc((${containerHeight} - ${TIMETABLE_CONFIG.HEADER_HEIGHT}px) / ${TIMETABLE_CONFIG.END_TIME - TIMETABLE_CONFIG.START_TIME})`;
    const getTop = (min: number) => `calc((${min} - ${TIMETABLE_CONFIG.START_TIME}) * ${minuteUnit} + ${TIMETABLE_CONFIG.HEADER_HEIGHT}px)`;
    const getHeight = (duration: number) => `calc(${duration} * ${minuteUnit})`;

    return (
        <div className="flex w-full bg-base-100 border-b border-base-content/20 h-full"
             style={{height: "100%"}}>
            {/* 時刻軸 (左端のカラム) */}
            <div className="w-10 border-l border-r border-base-content/50 relative shrink-0 bg-base-100 z-20">
                <div style={{height: TIMETABLE_CONFIG.HEADER_HEIGHT}} className="border-b border-base-content/50"/>
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
                        style={{height: TIMETABLE_CONFIG.HEADER_HEIGHT}}>
                        {translateDay(day)}
                    </div>

                    {/* 背景スロット: 次のコマの開始時間まで広げて描画 */}
                    {PERIODS.map((p, index) => {
                        const sMin = timeToMin(p.start);
                        const eMin = timeToMin(p.end);
                        const nextP = PERIODS[index + 1];
                        // 次のコマがあればその開始時刻まで、なければ自分の終了時刻まで
                        const visualEndMin = nextP ? timeToMin(nextP.start) : timeToMin(p.end);
                        const isOccupied = displaySchedules.some(s =>
                            s.dayOfWeek === day &&
                            s.isVisible && // 表示されているもののみ
                            // 授業の開始がスロット終了より前、かつ授業の終了がスロット開始より後
                            s.startMin < visualEndMin &&
                            s.endMin > sMin &&
                            // ロング授業のはみ出した部分は除外
                            s.startMin　+ 40 != eMin &&
                            s.endMin != sMin + 40
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
                                <p className="lg:text-xs md:text-[8px] hidden md:block font-normal">{sched.courseCode}</p>
                                <h1 className="lg:text-md md:text-xs text-[8px] line-clamp-3 font-bold leading-tight">
                                    {isJa ? sched.titleJa : sched.titleEn}
                                </h1>
                                <h2 className="lg:text-xs text-[8px]">{user && sched.room}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
export default TimetableGrid