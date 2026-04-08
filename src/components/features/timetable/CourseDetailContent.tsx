import type {UserCourseWithDetails} from "@/db/schema";
import {getSyllabusUrl} from "@/lib/course/utils.ts";
import {Eye, EyeOff, Pencil, SquareArrowOutUpRight, StickyNote, Trash2} from "lucide-react";
import {useTranslation} from "@/lib/translation/context.tsx";
import {ColorPicker} from "@/components/common/ColorPicker.tsx";

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
                {(!isCustom && 'rgNo' in course && course.rgNo) ? (
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
                <ColorPicker
                    value={course.colorCustom}
                    onChange={(color) => updateColor(course.id, color)}
                />
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