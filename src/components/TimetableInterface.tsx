import React from 'react';
import type {FlatSchedule} from "@/db/schema.ts";

const MIN_HEIGHT = 1.2;
const START_TIME = 8 * 60 + 45; // 08:45
const END_TIME = 20 * 60 + 15; // 20:15

const timeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m - START_TIME;
};

const GRID_PERIODS = [
    {label: '1', start: '08:45', end: '10:00'},
    {label: '2', start: '10:10', end: '11:25'},
    {label: '3', start: '11:35', end: '12:50'},
    {label: '昼', start: '12:50', end: '14:00'},
    {label: '4', start: '14:00', end: '15:15'},
    {label: '5', start: '15:25', end: '16:40'},
    {label: '6', start: '16:50', end: '18:05'},
    {label: '7', start: '18:15', end: '19:30'},
    {label: '夜', start: '19:30', end: '20:10'},
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TimetableProps {
    schedules: FlatSchedule[]
}

export default function TimetableInterface({schedules}: TimetableProps) {
    const totalHeight = (END_TIME - START_TIME) * MIN_HEIGHT;
    const HEADER_HEIGHT = 40;

    const renderDayColumn = (dayOfWeek: string) => {
        // 1. その曜日のコマを抽出してソート
        const daySchedules = schedules
            .filter(s => s.dayOfWeek === dayOfWeek)
            .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

        // 2. ★ 結合処理（すべての既存 mergedSchedules を対象に確認） ★
        const mergedSchedules: FlatSchedule[] = [];

        daySchedules.forEach(current => {
            const currentStart = timeToMin(current.startTime);

            // 既に mergedSchedules にある中で、同じ courseCode かつ「その終了時刻から10分以内」に current が始まるものを探す
            const targetIdx = mergedSchedules.findIndex(m => {
                const mEnd = timeToMin(m.endTime);
                return m.courseCode === current.courseCode &&
                    currentStart >= mEnd &&
                    (currentStart - mEnd) <= 10;
            });

            if (targetIdx !== -1) {
                // 見つかった場合、その Box の終了時間を更新
                mergedSchedules[targetIdx].endTime = current.endTime;
            } else {
                // 見つからない場合は新しい Box として追加
                mergedSchedules.push({ ...current });
            }
        });

        // 3. 衝突判定用のデータ作成
        const scheduleWithCol: (FlatSchedule & { startMin: number; endMin: number; col: number; displayEndMin: number })[] = [];

        mergedSchedules.forEach(sched => {
            const startMin = timeToMin(sched.startTime);
            const endMin = timeToMin(sched.endTime);

            // ★ 休み時間を埋めるための「表示上の終了時間」★
            // 後ろに10分余裕を持たせる（ただし20:15を超えないよう制限）
            const displayEndMin = Math.min(endMin + 10, END_TIME - START_TIME);

            let col = 0;
            // 衝突判定（displayEndMin を使うことで、延長した10分間も専有面積に含める）
            while (scheduleWithCol.some(c =>
                c.col === col &&
                Math.max(startMin, c.startMin) < Math.min(displayEndMin, c.displayEndMin)
            )) {
                col++;
            }
            scheduleWithCol.push({...sched, startMin, endMin, displayEndMin, col});
        });

        // 4. 重なりグループの最大幅計算
        const processedSchedules = scheduleWithCol.map(sched => {
            const group = scheduleWithCol.filter(other =>
                Math.max(sched.startMin, other.startMin) < Math.min(sched.displayEndMin, other.displayEndMin)
            );
            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            return {...sched, groupMaxCols};
        });

        return (
            <div key={dayOfWeek} style={{ flex: 1, borderRight: '1px solid #ccc', position: 'relative', height: totalHeight + HEADER_HEIGHT }}>
                {/* 背景グリッド描画 */}
                {GRID_PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute',
                        top: timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT,
                        height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        width: '100%', borderBottom: '1px solid #eee', backgroundColor: '#fafafa'
                    }}/>
                ))}

                {/* コマの描画 */}
                {processedSchedules.map((sched, i) => {
                    const width = 100 / sched.groupMaxCols;
                    const left = sched.col * width;
                    const top = sched.startMin * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (sched.displayEndMin - sched.startMin) * MIN_HEIGHT;

                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height - 1}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                            border: '1px solid #444',
                            backgroundColor: 'white',
                            zIndex: 10,
                            padding: '6px',
                            fontSize: '11px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            <div style={{fontWeight: 'bold', lineHeight: '1.2'}}>{sched.titleJa}</div>
                            <div style={{ fontSize: '9px', color: '#666', marginTop: 'auto' }}>
                                {sched.startTime}-{sched.endTime}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex', border: '1px solid #ccc', borderRight: 'none',
            fontFamily: 'sans-serif', backgroundColor: '#fff', width: '100%'
        }}>
            {/* 時刻軸 */}
            <div style={{
                width: '65px',
                borderRight: '1px solid #ccc',
                position: 'relative',
                backgroundColor: '#fdfdfd'
            }}>
                <div style={{height: HEADER_HEIGHT, borderBottom: '1px solid #ccc'}}/>
                {GRID_PERIODS.map(p => {
                    const top = timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT;

                    return (
                        <div key={p.label} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                        }}>
                            {/* 開始時刻（線の真上） */}
                            <div style={{
                                fontSize: '10px', color: '#333', fontWeight: 'bold',
                                position: 'absolute', top: 0,
                                backgroundColor: '#fdfdfd', padding: '0 2px', zIndex: 1
                            }}>
                                {p.start}
                            </div>

                            {/* 中央エリア（ラベル、および昼休みのみ時刻） */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                width: '100%'
                            }}>
                                <div style={{fontSize: '15px', color: '#bbb', fontWeight: 'bold', lineHeight: 1}}>
                                    {p.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {DAYS.map(renderDayColumn)}
        </div>
    );
}