import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

// --- Courses)---
// シラバスデータなどの基本情報を保持
export const courses = sqliteTable("courses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(), // 2024, 2025...
    term: text("term", { enum: ["Autumn", "Winter", "Spring"] }).notNull(),
    courseCode: text("course_code").notNull(), // 例: GES001
    rgNo: text("rg_no").notNull(), // RegID
    titleJa: text("title_ja").notNull(),
    titleEn: text("title_en").notNull(),
    instructor: text("instructor").notNull(),
    room: text("room"),
    language: text("language"), // J, E, J/E
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
    index("year_term_idx").on(table.year, table.term),
    index("rg_no_idx").on(table.rgNo),
]);

// --- Course Schedules ---
// 「第4限」や「Long4」を柔軟に扱うためのテーブル
export const courseSchedules = sqliteTable("course_schedules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    dayOfWeek: text("day_of_week", { enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] }).notNull(),

    // ICU標準の枠組み
    period: integer("period"), // 他校科目の場合は null 許容
    isLong: integer("is_long", { mode: "boolean" }).default(false),

    // 他校・特殊科目用の絶対時間情報 (例: "10:10")
    startTime: text("start_time"),
    endTime: text("end_time"),
});

// --- User Timetables / Enrollments ---
// ユーザーがどの授業を自分の時間割に入れたかを管理
export const userCourses = sqliteTable("user_courses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(), // BetterAuthのUser IDと紐付け
    courseId: text("course_id").notNull().references(() => courses.id),
    year: integer("year").notNull(),
    term: text("term").notNull(),
    colorCustom: text("color_custom"), // UI上の色分け用
    memo: text("memo"), // 授業ごとの自分用メモ
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
    index("user_term_idx").on(table.userId, table.year, table.term),
]);

// --- Categories & Tags ---
export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nameJa: text("name_ja").notNull(), // 例: 自然科学, 教職, メジャー
    nameEn: text("name_en").notNull(),
});

export const courseToCategories = sqliteTable("course_to_categories", {
    courseId: text("course_id").notNull().references(() => courses.id),
    categoryId: integer("category_id").notNull().references(() => categories.id),
}, (table) => [
    primaryKey({ columns: [table.courseId, table.categoryId] }),
]);