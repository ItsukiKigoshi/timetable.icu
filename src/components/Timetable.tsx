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
    {label: '1', start: '08:45', end: '10:00', next: '10:10'},
    {label: '2', start: '10:10', end: '11:25', next: '11:35'},
    {label: '3', start: '11:35', end: '12:50', next: '12:50'},
    {label: '昼', start: '12:50', end: '14:00', next: '14:00'},
    {label: '4', start: '14:00', end: '15:15', next: '15:25'},
    {label: '5', start: '15:25', end: '16:40', next: '16:50'},
    {label: '6', start: '16:50', end: '18:05', next: '18:15'},
    {label: '7', start: '18:15', end: '19:30', next: '19:30'},
    {label: 'L7', start: '19:30', end: '20:10', next: '20:15'},
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TimetableProps {
    schedules: FlatSchedule[]
}

export default function Timetable({schedules}: TimetableProps) {
    const totalHeight = (END_TIME - START_TIME) * MIN_HEIGHT;
    const HEADER_HEIGHT = 40; // 時刻+ラベルを表示するため少し高く設定

    const renderDayColumn = (dayOfWeek: string) => {
        // 1. その曜日のコマを抽出してソート
        const daySchedules = schedules
            .filter(s => s.dayOfWeek === dayOfWeek)
            .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

        // 2. 各コマの衝突判定と列(col)割り当て
        const scheduleWithCol: (FlatSchedule & { startMin: number; endMin: number; col: number })[] = [];

        daySchedules.forEach(sched => {
            const startMin = timeToMin(sched.startTime);
            const endMin = timeToMin(sched.endTime);
            let col = 0;

            while (scheduleWithCol.some(c =>
                c.col === col &&
                Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin)
            )) {
                col++;
            }
            scheduleWithCol.push({...sched, startMin, endMin, col});
        });

        // 3. 重なりグループの幅計算（ロジックは以前のものを流用）
        const processedSchedules = scheduleWithCol.map(sched => {
            const group: typeof scheduleWithCol = [];
            const visited = new Set<number>();
            const queue = [sched];

            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current.id)) continue;
                visited.add(current.id);
                group.push(current);

                scheduleWithCol.forEach(other => {
                    if (Math.max(current.startMin, other.startMin) < Math.min(current.endMin, other.endMin)) {
                        queue.push(other);
                    }
                });
            }

            const groupMaxCols = Math.max(...group.map(c => c.col)) + 1;
            return {...sched, groupMaxCols};
        });

        return (
            <div key={dayOfWeek} style={{
                flex: 1,
                borderRight: '1px solid #ccc',
                position: 'relative',
                height: totalHeight + HEADER_HEIGHT
            }}>
                {/* 曜日ヘッダー */}
                <div style={{
                    textAlign: 'center', borderBottom: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold',
                    height: HEADER_HEIGHT, lineHeight: `${HEADER_HEIGHT}px`, backgroundColor: '#fdfdfd'
                }}>{dayOfWeek}</div>

                {/* 背景グリッド */}
                {GRID_PERIODS.map(p => (
                    <div key={p.label} style={{
                        position: 'absolute',
                        top: timeToMin(p.start) * MIN_HEIGHT + HEADER_HEIGHT,
                        height: (timeToMin(p.end) - timeToMin(p.start)) * MIN_HEIGHT,
                        width: '100%',
                        borderBottom: '1px solid #eee',
                        borderTop: '1px solid #eee',
                        boxSizing: 'border-box',
                        backgroundColor: '#fafafa'
                    }}/>
                ))}

                {/* コマの描画 */}
                {processedSchedules.map((sched, i) => {
                    // groupMaxCols を使うことで、右側の隙間を埋める
                    const width = 100 / sched.groupMaxCols;
                    const left = sched.col * width;
                    const top = sched.startMin * MIN_HEIGHT + HEADER_HEIGHT;
                    const height = (sched.endMin - sched.startMin) * MIN_HEIGHT;

                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                            border: '1px solid #333',
                            backgroundColor: 'white',
                            zIndex: 10,
                            padding: '4px',
                            fontSize: '11px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '1px 1px 2px rgba(0,0,0,0.05)',
                            overflow: 'hidden'
                        }}>
                            <div style={{fontWeight: 'bold', lineHeight: '1.2'}}>{sched.title}</div>
                            <div style={{
                                fontSize: '9px',
                                color: '#666',
                                marginTop: 'auto'
                            }}>{sched.startTime}-{sched.endTime}</div>
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
                    const isLunch = p.label === '昼';

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