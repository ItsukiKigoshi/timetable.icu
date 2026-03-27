// src/components/CourseList.tsx
import { useState, useMemo } from 'react';
import type { ProcessedSchedule } from './TimetableInterface';

interface CourseListProps {
    courses: ProcessedSchedule[]; // CourseManagerでuniqueにされたデータ
}

type SortKey = 'code' | 'title' | 'schedule';

export default function CourseList({ courses }: CourseListProps) {
    const [sortKey, setSortKey] = useState<SortKey>('code');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    // --- 効率的なデータ処理: 検索とソート ---
    // 1. 検索フィルタリング -> 2. ソート の順に適用。
    // useMemoにより、入力が変わらない限り再計算されない。
    const processedList = useMemo(() => {
        // A. まず検索語でフィルタ
        const filtered = courses.filter(course =>
            course.titleJa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // B. 次にソート
        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'code':
                    comparison = a.courseCode.localeCompare(b.courseCode);
                    break;
                case 'title':
                    comparison = (a.titleJa || '').localeCompare(b.titleJa || '');
                    break;
                case 'schedule':
                    // 曜日(dayOfWeek)と開始時間(startTime)でソート
                    // ※実運用では曜日を数値化して比較する必要あり。ここでは単純化
                    comparison = `${a.dayOfWeek}${a.startTime}`.localeCompare(`${b.dayOfWeek}${b.startTime}`);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [courses, sortKey, sortOrder, searchTerm]);

    // ソート状態を変更する関数
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    // ソートアイコンのレンダリング
    const SortIcon = ({ id }: { id: SortKey }) => {
        if (sortKey !== id) return <span className="opacity-30">⇅</span>;
        return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>;
    };

    return (
        <div className="card card-bordered bg-base-100 shadow-xl h-full">
            <div className="card-body p-4">
                <h2 className="card-title text-sm flex justify-between">
                    登録コース一覧 ({processedList.length})
                </h2>

                {/* 検索入力欄 */}
                <input
                    type="search"
                    placeholder="コース名、コード、教員で検索..."
                    className="input input-bordered input-sm w-full my-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* ソートボタン群（ daisyUI の join クラスを使用） */}
                <div className="join w-full grid grid-cols-3 mb-3">
                    {(['code', 'title', 'schedule'] as SortKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => handleSort(key)}
                            className={`btn btn-xs join-item ${sortKey === key ? 'btn-active' : ''}`}
                        >
                            {key === 'code' ? 'コード' : key === 'title' ? '名称' : '時限'}
                            <SortIcon id={key} />
                        </button>
                    ))}
                </div>

                {/* リスト表示部分 */}
                <div className="overflow-y-auto h-[500px] xl:h-[calc(100vh-250px)] pr-2 space-y-2">
                    {processedList.length === 0 && (
                        <div className="text-center py-8 text-xs opacity-60">該当するコースはありません</div>
                    )}

                    {processedList.map((course) => (
                        <div key={course.courseId} className="p-3 bg-base-200 rounded-lg border border-base-300 hover:border-primary transition-colors text-xs">
                            <div className="flex justify-between items-start gap-1">
                                <span className="font-mono text-primary font-bold">{course.courseCode}</span>
                                <span className="badge badge-sm badge-outline">{course.rgNo}</span>
                            </div>
                            <h3 className="font-bold my-1 line-clamp-2" title={course.titleJa}>{course.titleJa}</h3>
                            <div className="flex justify-between text-opacity-70 text-[11px]">
                                <span>{course.instructor}</span>
                                <span className="font-medium text-secondary">
                  {/* 実際は複数のコマ情報を表示する必要あり */}
                                    {course.dayOfWeek} {course.startTime}-{course.endTime}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}