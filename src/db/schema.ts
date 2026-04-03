import * as authSchema from "./auth-schema.ts";
import {user} from "./auth-schema.ts";

import {type InferSelectModel, relations, sql} from "drizzle-orm";
import {index, integer, primaryKey, real, sqliteTable, text, uniqueIndex,} from "drizzle-orm/sqlite-core";

export * from "./auth-schema.ts";

export const daysEnum = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
] as const;

// --- Courses ---
// シラバスデータなどの基本情報を保持
export const courses = sqliteTable(
    "courses",
    {
        id: integer("id").primaryKey({autoIncrement: true}),
        year: integer("year").notNull(),
        rgNo: text("rg_no").notNull(),
        status: text("status", {enum: ["active", "cancelled"]}).default("active"),
        term: text("term", {enum: ["Spring", "Autumn", "Winter"]}).notNull(),
        courseCode: text("course_code").notNull(), // 例: GES001
        titleJa: text("title_ja").notNull(),
        titleEn: text("title_en").notNull(),
        instructor: text("instructor").notNull(),
        room: text("room"),
        language: text("language"),

        // 1/3単位を 0.333... として保持するため real型 を使用
        units: real("units").notNull().default(0),

        updatedAt: integer("updated_at").default(sql`(unixepoch()
                                                     )`),
    },
    (table) => [
        uniqueIndex("year_rgno_unique_idx").on(table.year, table.rgNo),
        index("year_term_status_code_idx").on(
            table.year,
            table.term,
            table.status,
            table.courseCode
        ),
        index("year_term_status_lang_idx").on(
            table.year,
            table.term,
            table.status,
            table.language
        ),
        index("year_term_status_units_idx").on(
            table.year,
            table.term,
            table.status,
            table.units
        ),
        index('course_no_idx').on(table.courseCode),
    ],
);

// --- 2. 統合スケジュール (絶対時間ベース) ---
export const courseSchedules = sqliteTable(
    "course_schedules",
    {
        id: integer("id").primaryKey({autoIncrement: true}),
        courseId: integer("course_id")
            .notNull()
            .references(() => courses.id, {onDelete: "cascade"}),
        dayOfWeek: text("day_of_week", {enum: daysEnum}).notNull(),
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        period: integer("period"),
        isLong: integer("is_long", {mode: "boolean"}).default(false),

        // --- 理系の演習授業の選択肢 ---
        // true の場合、< > で囲まれた選択科目のコマであることを示す
        isAlternative: integer("is_alternative", {mode: "boolean"}).default(
            false,
        ),
        // 同じ数字(1, 2...)を持つコマ同士が「一つの選択肢グループ」であることを示す
        // 例: 6/M,7/M が "group 1"、6/W,7/W が "group 2"
        altGroupId: integer("alt_group_id"),
    },
    (table) => [
        index("course_id_idx").on(table.courseId),
        index("day_period_idx").on(table.dayOfWeek, table.period),
        index("search_schedule_idx").on(
            table.dayOfWeek,
            table.period,
            table.courseId,
        ),
    ],
);

// --- 3. ユーザーの履修登録状況 ---
// ICUの科目のみ.
export const userCourses = sqliteTable(
    "user_courses",
    {
        id: integer("id").primaryKey({autoIncrement: true}),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, {onDelete: "cascade"}),
        courseId: integer("course_id")
            .notNull()
            .references(() => courses.id, {onDelete: "cascade"}),

        // 時間割上での表示・非表示を切り替えるフラグ
        isVisible: integer("is_visible", {mode: "boolean"}).notNull().default(true),

        // 理系科目などの「グループ選択」が必要な場合、どのグループを選んだかを保持
        // 例: altGroupId = 1 のコマ群を表示する場合、ここに 1 を入れる
        selectedAltGroupId: integer("selected_alt_group_id"),
        colorCustom: text("color_custom"),
        memo: text("memo"),

        createdAt: integer("created_at").default(sql`(unixepoch()
                                                     )`),
    },
    (table) => [
        index("user_courses_uid_idx").on(table.userId),
        uniqueIndex("user_course_unique_idx").on(table.userId, table.courseId),
    ],
);

// --- カスタム科目 (他校・手打ち) ---
// customCoursesは, userIdのユーザの持ち物
export const customCourses = sqliteTable("custom_courses", {
    id: integer("id").primaryKey({autoIncrement: true}),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),

    title: text("title").notNull(),
    instructor: text("instructor"),
    room: text("room"),

    units: real("units").notNull().default(0),

    dayOfWeek: text("day_of_week", {enum: daysEnum}).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),

    year: integer("year").notNull(),
    term: text("term").notNull(),

    colorCustom: text("color_custom"),
    memo: text("memo"),

    // 公式授業を上書きしたい場合
    // どの公式授業を上書きしたかの参照（任意）
    overriddenCourseId: integer("overridden_course_id").references(
        () => courses.id,
    ),

    createdAt: integer("created_at").default(sql`(unixepoch()
                                                 )`),
});

// --- Categories & Tags ---
export const categories = sqliteTable("categories", {
    id: text("id").primaryKey(), // 'MBIO', 'ELA' など
    nameJa: text("name_ja").notNull(),
    nameEn: text("name_en").notNull(),
});

export const courseToCategories = sqliteTable(
    "course_to_categories",
    {
        courseId: integer("course_id")
            .notNull()
            .references(() => courses.id),
        categoryId: text("category_id")
            .notNull()
            .references(() => categories.id),
    },
    (table) => [
        primaryKey({columns: [table.courseId, table.categoryId]}),
        index("category_id_idx").on(table.categoryId),
        index("category_search_idx").on(table.categoryId, table.courseId),
    ],
);

// --- User側からのリレーション ---
// 1人のユーザーは「複数の履修登録(公式)」と「複数のカスタム科目」を持つ
// Authのuserとのrelationもここでまとめる
export const userRelations = relations(user, ({many}) => ({
    sessions: many(authSchema.session),
    accounts: many(authSchema.account),
    passkeys: many(authSchema.passkey),
    userCourses: many(userCourses),
    customCourses: many(customCourses),
}));

// --- userCourses (公式履修) のリレーション ---
export const userCoursesRelations = relations(userCourses, ({one}) => ({
    user: one(user, {fields: [userCourses.userId], references: [user.id]}),
    course: one(courses, {
        fields: [userCourses.courseId],
        references: [courses.id],
    }),
}));

// --- customCourses (カスタム科目) のリレーション ---
export const customCoursesRelations = relations(customCourses, ({one}) => ({
    user: one(user, {fields: [customCourses.userId], references: [user.id]}),
}));

// --- courses (公式マスタ) とスケジュールのリレーション ---
export const courseRelations = relations(courses, ({many}) => ({
    schedules: many(courseSchedules),
}));

export const courseSchedulesRelations = relations(
    courseSchedules,
    ({one}) => ({
        course: one(courses, {
            fields: [courseSchedules.courseId],
            references: [courses.id],
        }),
    }),
);

// --- Types ---


// --- Base Types (DBから直接抽出) ---
export type Course = InferSelectModel<typeof courses>;
export type Schedule = InferSelectModel<typeof courseSchedules>;
export type UserCourseEntry = InferSelectModel<typeof userCourses>;

// --- Helper: メタデータ部分だけを抽出 ---
// userId や createdAt などの不要なカラムを除いた「ユーザー設定」のみの型
export type UserCourseMetadata = Pick<
    UserCourseEntry,
    "isVisible" | "selectedAltGroupId" | "colorCustom" | "memo"
>;

// --- Final Types ---
// リレーション込みの型
export type CourseWithSchedules = Course & {
    schedules: Schedule[];
};

export type Categories = InferSelectModel<typeof categories>;

// Partial をつけることで、ゲストユーザー（UserCourseEntryがない状態）にも対応
export type FlatSchedule = Schedule & Course & Partial<UserCourseMetadata> & {
    scheduleId: number;
};