import type {UserCourseWithDetails} from "@/db/schema";
import {DEFAULT_TERM, DEFAULT_YEAR, PERIODS} from "@/constants/time.ts";
import type {User} from "better-auth";
import {useEffect, useMemo, useState} from "react";
import {LayoutGrid, List} from "lucide-react";
import {createTranslationHelper} from "@/lib/translation/utils.ts";
import {useTimetable} from "@/lib/timetable/hooks.ts";
import {timeToMin} from "@/lib/timetable/utils.ts";
import CourseDetailContent from "@/components/features/timetable/CourseDetailContent.tsx";
import {formatUnits} from "@/lib/course/utils.ts";
import TimetableGrid from "@/components/features/timetable/TimetableGrid.tsx";
import CourseList from "@/components/features/timetable/CourseList.tsx";
import CourseHeader from "@/components/common/CourseHeader.tsx";
import Modal from "@/components/common/Modal.tsx";
import {LanguageProvider} from "@/lib/translation/context.tsx";

export default function TimetableInterface({
                                               initialCourses,
                                               user,
                                               lang = 'ja',
                                               selectedYear = DEFAULT_YEAR,
                                               selectedTerm = DEFAULT_TERM
}: {
    initialCourses: UserCourseWithDetails[],
    user?: User | null,
    lang?: string,
    selectedYear: number,
    selectedTerm: string
}) {
    const {
        courses,       // コース単位のリスト
        schedules,     // 平坦化されたもの
        displayCourses,
        displaySchedules,
        toggleCourse,
        toggleVisibility,
        updateMemo
    } = useTimetable({
        initialCourses: initialCourses, // Astroから渡されたもの
        user,
        selectedYear,
        selectedTerm
    });
    // 翻訳
    const {t, isJa, translateDay, translatePeriod} = createTranslationHelper(lang);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period: string, start: string, end: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<UserCourseWithDetails | null>(null);
    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

    // --- Effect ---
    // その時間枠（Day/Period）に該当する UserCourseWithDetails
    const coursesInSelectedSlot = useMemo(() => {
        if (!selectedSlot) return [];
        // 1. まずその時間枠にあるコマの ID を取得
        const slotCourseIds = schedules
            .filter(s =>
                // 選択された年・学期と一致するかチェックする
                s.year === selectedYear &&
                s.term === selectedTerm &&
                s.isVisible !== false && // 非表示のものは除外
                s.dayOfWeek === selectedSlot.day &&
                // periodのlabelが一致する　もしくは　Long授業の条件に合致するコースをそのコマの授業としてカウント
                (
                    s.period === parseInt(selectedSlot.period) ||
                    // ロング授業のはみ出した部分もクリック可能に
                    timeToMin(s.startTime) ===  timeToMin(selectedSlot.start) + 30 ||   // Long 4（授業開始時刻がそのコマ（昼休み）の開始時刻のちょうど30分後）
                    timeToMin(s.endTime) === timeToMin(selectedSlot.start) + 30         // Long 5-7（授業終了時刻がそのコマ（6,7,夜限）の開始時刻のちょうど30分後）
                )
            )
            .map(s => s.id); // UserCourse の ID


        // 2. その ID に一致する「コース本体」を courses から抽出
        return displayCourses.filter(c => slotCourseIds.includes(c.id) && c.isVisible !== false);
    }, [selectedSlot, schedules, courses]);

    // モーダル内のコースが 0 になったら閉じる
    useEffect(() => {
        // モーダルが開いている（selectedSlotがある）かつ、中身が空になった場合
        if (selectedSlot && coursesInSelectedSlot.length === 0) {
            setSelectedSlot(null);
        }
    }, [coursesInSelectedSlot.length, selectedSlot]);

    // 個別授業詳細モーダルを表示中、その授業が courses から消えたら閉じる
    useEffect(() => {
        if (selectedCourse) {
            const isStillExists = courses.some(c => c.id === selectedCourse.id);
            if (!isStillExists) {
                setSelectedCourse(null);
            }
        }
    }, [courses, selectedCourse]);

    // Memo
    // isVisible が true かつ選択中の年・学期の授業のみの単位合計を計算
    const visibleTotalUnits = useMemo(() => {
        return displayCourses
            .filter(c => c.isVisible)
            .reduce((sum, c) => sum + (c.units || 0), 0);
    }, [displayCourses]);

    const currentSelectedCourse = useMemo(() => {
        if (!selectedCourse) return null;
        // selectedCourse.id をキーに、常に state(courses) 内の最新オブジェクトを返す
        return displayCourses.find(c => c.id === selectedCourse.id) || selectedCourse;
    }, [selectedCourse, courses, displayCourses]);

    // --- 関数 ---
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

    // クリックハンドラーはステートの更新だけ
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
            setSelectedSlot({day, period: p.label, start: p.start, end: p.end});
        }
    };

    return (
        <LanguageProvider lang={lang}>
        <section className="flex flex-col w-full select-none h-full relative overflow-hidden">
            {/* 1. 左側：表示モード切り替え (Grid/List) */}
            <nav
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
            </nav>

            {/* フローティング単位表示バッジ */}
            <section className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 pointer-events-none">
                <div
                    className="bg-neutral text-neutral-content px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-3 backdrop-blur-md bg-opacity-80 transition-all duration-300">
                    <span className="text-lg font-mono font-black">
                        {formatUnits(visibleTotalUnits)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
                        {t('timetable.units')}
                    </span>
                </div>
            </section>

            {/* メインコンテンツエリア */}
            <div className="flex-1 overflow-hidden relative">
                {/* モバイル表示：useStateの値で出し分け */}
                <div className="lg:hidden h-full w-full">
                    {viewMode === 'grid' ? (
                        <div className="h-full w-full">
                            <TimetableGrid
                                displaySchedules={displaySchedules}
                                user={user}
                                isJa={isJa}
                                translateDay={translateDay}
                                translatePeriod={translatePeriod}
                                handleSlotClick={handleSlotClick}
                            />
                        </div>
                    ) : (
                        <div className="h-full w-full overflow-y-auto">
                            <CourseList
                                items={displayCourses}
                                isJa={isJa}
                                t={t}
                                setSelectedCourse={setSelectedCourse}
                                toggleVisibility={toggleVisibility}
                                handleToggle={handleToggle}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    )}
                </div>

                {/* 3. PC用 2カラム*/}
                <div className="hidden lg:flex h-full overflow-hidden border-t border-base-300">
                    <aside className="w-80 flex flex-col bg-base-200/20 border-r border-base-300">
                        <div className="flex-1 overflow-y-auto">
                            <CourseList
                                items={displayCourses}
                                isJa={isJa}
                                t={t}
                                setSelectedCourse={setSelectedCourse}
                                toggleVisibility={toggleVisibility}
                                handleToggle={handleToggle}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </aside>
                    <main className="flex-1 overflow-hidden bg-base-100">
                        <TimetableGrid
                            displaySchedules={displaySchedules}
                            user={user}
                            isJa={isJa}
                            translateDay={translateDay}
                            translatePeriod={translatePeriod}
                            handleSlotClick={handleSlotClick}
                        />
                    </main>
                </div>
            </div>

            {/* 詳細モーダル */}
            <Modal
                isOpen={!!selectedSlot}
                onClose={() => setSelectedSlot(null)}
                title={selectedSlot
                    ? (`${translateDay(selectedSlot.day)} ${t('timetable.period').replace('{period}', translatePeriod(selectedSlot.period) ?? '')}`)
                    : ""}>
                        {coursesInSelectedSlot.length === 1 ? (
                            // --- 1つの場合：即座に詳細を表示 ---
                            <section className="flex flex-col gap-2">
                                <div className="mb-2 border-b pb-4">
                                    <CourseHeader course={coursesInSelectedSlot[0]} showYearTerm={true} />
                                </div>
                                <CourseDetailContent
                                    course={coursesInSelectedSlot[0]}
                                    updateMemo={updateMemo}
                                    toggleVisibility={() => toggleVisibility(coursesInSelectedSlot[0].id)}
                                    handleToggle={handleToggle}
                                    isSubmitting={isSubmitting}
                                />
                            </section>
                        ) : (
                            // --- 複数の場合：アコーディオン ---
                            <div className="flex flex-col gap-2">
                                {coursesInSelectedSlot.map((c) => {
                                    const isExpanded = expandedCourseId === c.id;
                                    return (
                                        <div
                                            key={c.id}
                                            className={`collapse collapse-arrow bg-base-200/50 border border-base-300
                                             ${isExpanded ? 'collapse-open' : 'collapse-close'}`}>
                                            {/* コース概要 */}
                                            <div
                                                className="gap-2 collapse-title pr-10 cursor-pointer active:bg-base-300/50"
                                                onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <CourseHeader course={c} showYearTerm={true} />
                                            </div>

                                            {/* 内容部分 */}
                                            <div className="collapse-content border-t border-base-300 bg-base-100 px-0">
                                                <div className="p-4">
                                                    <CourseDetailContent
                                                        course={c}
                                                        updateMemo={updateMemo}
                                                        toggleVisibility={() => toggleVisibility(c.id)}
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
            </Modal>
            {/* --- 個別授業詳細モーダル --- */}
            <Modal
                isOpen={!!currentSelectedCourse}
                onClose={() => setSelectedCourse(null)}
            >
                    {currentSelectedCourse && (
                        <section className="flex flex-col gap-2">
                            <div className="mb-2 border-b pb-4">
                                <CourseHeader course={currentSelectedCourse} showYearTerm={true} />
                            </div>
                            <CourseDetailContent
                                course={currentSelectedCourse}
                                updateMemo={updateMemo}
                                toggleVisibility={() => toggleVisibility(currentSelectedCourse.id)}
                                handleToggle={handleToggle}
                                isSubmitting={isSubmitting}
                            />
                        </section>
                    )}
            </Modal>
        </section>
        </LanguageProvider>
    );
}
