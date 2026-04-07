import type {UserCourseWithDetails} from "@/db/schema";
import {getSyllabusUrl} from "@/lib/course/utils.ts";
import {Eye, EyeOff, Pencil, SquareArrowOutUpRight, StickyNote, Trash2} from "lucide-react";
import {useTranslation} from "@/lib/translation/context.tsx";
import {SWATCHES} from "@/constants/config.ts";

// --- 授業の詳細: メモ, シラバス，表示非表示，削除 ---
const CourseDetailContent = ({
                                 course,
                                 toggleVisibility,
                                 handleToggle,
                                 updateColor,
                                 updateMemo,
                                 isSubmitting,
                                    }: {
    course: UserCourseWithDetails,
    toggleVisibility: (courseId: number | string) => void;
    handleToggle: (c: UserCourseWithDetails) => void,
    updateMemo: (courseId: number | string, memo: string) => void,
    updateColor: (courseId: number | string, color: string | null) => void,
    isSubmitting: number | string | null
}) => {
    const {t} = useTranslation();
    const cId = course.id;
    const isCustom = typeof course.id === 'string';

    return (
        <div className="flex flex-col gap-4 py-2">
            {/* メインアクション */}
            <div className="grid grid-cols-4 gap-2">
                {/* シラバス/編集 (2/4 を占有) */}
                {!isCustom ? (
                    <a href={getSyllabusUrl(course.rgNo, course.year, course.term)} target="_blank" rel="noreferrer"
                       className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300"
                       title={t('timetable.syllabus')}>
                        <SquareArrowOutUpRight size="16"/>
                        <span className="truncate">{t('timetable.syllabus')}</span>
                    </a>
                ):(
                    <a href={`/edit/${course.id}`}
                       className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300">
                            <Pencil size={16} />
                            内容を編集
                        </a>
                    )}


                {/* 表示/非表示 (1/4 を占有) */}
                <button onClick={() => toggleVisibility(course.id)}
                        className={`btn btn-md gap-2 col-span-1 ${!course.isVisible ? 'btn-ghost border-base-300    ' : 'btn-neutral'}`}>
                    {course.isVisible ? <Eye size="18"/> : <EyeOff size="18"/>}
                </button>

                {/* 削除 (1/4 を占有) */}
                <button onClick={() => handleToggle(course)}
                        disabled={isSubmitting === cId}
                        className="btn btn-md btn-error col-span-1 gap-2">
                    {isSubmitting === cId ? (
                        <span className="loading loading-spinner loading-xs"/>
                    ) : (
                        <Trash2 size="18"/>
                    )}
                </button>
            </div>

            {/* カラー選択セクション */}
            <div className="flex items-center gap-3">
                {/* 1. 現在の色の円形インジケーター*/}
                <div className="flex items-center justify-center w-6 h-10 shrink-0">
                    <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm transition-colors duration-500"
                        style={{ backgroundColor: course.colorCustom || "var(--color-primary)" }}
                    />
                </div>

                {/* 2. HEX入力 + パレット (Dropdown) */}
                <div className="dropdown dropdown-bottom flex-1">
                    <div
                        className="flex items-center h-10 px-3 bg-base-100 border border-base-300 rounded-md shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all"
                    >
                        <span className="text-xs opacity-30 font-mono mr-1.5">#</span>
                        <input
                            type="text"
                            tabIndex={0}
                            value={course.colorCustom ? course.colorCustom.replace('#', '') : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                    updateColor(course.id, val ? `#${val}` : null);
                                }
                            }}
                            spellCheck={false}
                            className="w-full bg-transparent border-none outline-none font-mono text-sm p-0 focus:ring-0"
                            placeholder="DEFAULT"
                        />
                    </div>

                    {/* パレット本体 */}
                    <div
                        className="dropdown-content z-30 mt-1 p-2 bg-base-100 border border-base-300 rounded-md shadow-xl ring-1 ring-black/5"
                    >
                        {/* 7列グリッド */}
                        <div className="grid grid-cols-7 gap-1.5">

                            {/* 【パレット冒頭】デフォルトに戻すボタン */}
                            <button
                                onClick={() => {
                                    updateColor(course.id, null);
                                    (document.activeElement as HTMLElement)?.blur();
                                }}
                                className={`w-6 h-6 rounded-sm border flex items-center justify-center
                                    ${!course.colorCustom
                                    ? 'border-primary ring-1 ring-primary ring-offset-1'
                                    : 'border-base-300 bg-base-200'}`}
                                title="Default color"
                            >
                                {/* 斜線アイコン（デフォルトを表現） */}
                                <svg className="w-full h-full p-1 opacity-40" viewBox="0 0 24 24">
                                    <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>

                            {/* カラーパレット */}
                            {SWATCHES.map((hex) => (
                                <button
                                    key={hex}
                                    onClick={() => {
                                        updateColor(course.id, hex);
                                        (document.activeElement as HTMLElement)?.blur();
                                    }}
                                    className={`w-6 h-6 rounded-sm border border-black/5 ${
                                        course.colorCustom === hex ? 'ring-2 ring-primary ring-offset-1' : ''
                                    }`}
                                    style={{ backgroundColor: hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* メモ */}
            <div className="form-control w-full">
                <label className="label pt-0">
                    <span className="label-text flex items-center gap-2 font-bold opacity-70">
                        <StickyNote size="14"/> {t('timetable.memo')}
                    </span>
                </label>
                <textarea
                    className="textarea textarea-bordered w-full h-24 text-sm focus:textarea-primary"
                    placeholder={t('timetable.memo.content')}
                    defaultValue={course.memo || ""}
                    onBlur={(e) => updateMemo(course.id, e.target.value)} // フォーカスが外れた時に保存
                ></textarea>
            </div>
        </div>
    );
};
export default CourseDetailContent