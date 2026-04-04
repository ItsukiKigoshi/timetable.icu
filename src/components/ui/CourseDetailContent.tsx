import type {UserCourseWithDetails} from "@/db/schema";
import {getSyllabusUrl} from "@/lib/course/utils.ts";
import {Eye, EyeOff, SquareArrowOutUpRight, StickyNote, Trash2} from "lucide-react";
import {useTranslation} from "@/lib/translation/context.tsx";

// --- 授業の詳細: メモ, シラバス，表示非表示，削除 ---
const CourseDetailContent = ({
                                        course,
                                        toggleVisibility,
                                        handleToggle,
                                        isSubmitting,
                                        updateMemo
                                    }: {
    course: UserCourseWithDetails,
    updateMemo: (courseId: number, memo: string) => void,
    toggleVisibility: (courseId: number) => void;
    handleToggle: (c: UserCourseWithDetails) => void,
    isSubmitting: number | null
}) => {
    const {t} = useTranslation();
    const cId = course.id;

    return (
        <div className="flex flex-col gap-4 py-2">
            {/* メインアクション */}
            <div className="grid grid-cols-4 gap-2">
                {/* シラバス (2/4 を占有) */}
                <a href={getSyllabusUrl(course.rgNo, course.year, course.term)} target="_blank" rel="noreferrer"
                   className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300"
                   title={t('timetable.syllabus')}>
                    <SquareArrowOutUpRight size="16"/>
                    <span className="truncate">{t('timetable.syllabus')}</span>
                </a>

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

            {/* メモ */}
            <div className="form-control w-full">
                <label className="label pt-0">
                    <span className="label-text flex items-center gap-2 font-bold opacity-70">
                        <StickyNote size="14"/> {t('timetable.memo')}
                    </span>
                </label>
                <textarea
                    className="textarea textarea-bordered w-full h-24 text-sm focus:textarea-primary"
                    placeholder="課題や教室のメモ..."
                    defaultValue={course.memo || ""}
                    onBlur={(e) => updateMemo(course.id, e.target.value)} // フォーカスが外れた時に保存
                ></textarea>
            </div>
        </div>
    );
};
export default CourseDetailContent