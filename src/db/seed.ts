import {Database} from "bun:sqlite";
import {drizzle} from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import {courses, courseSchedules, courseToCategories} from "./schema";
import fs from "fs";
import path from "path";
import {eq} from "drizzle-orm";

async function runSeed() {
    const dbPath = process.argv[2];

    if (!dbPath) {
        console.error("❌ SQLite file path not provided.");
        process.exit(1);
    }

    console.log(`📁 Connecting to Bun SQLite: ${dbPath}`);

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, {schema});

    const dataPath = path.resolve(process.cwd(), "dist_courses.json");
    if (!fs.existsSync(dataPath)) {
        console.error("❌ dist_courses.json not found.");
        return;
    }

    const coursesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    console.log(`🚀 Syncing ${coursesData.length} courses...`);

    await db.transaction(async (tx) => {
        for (const item of coursesData) {
            try {
                // 2. Course の Upsert (既存)
                const [upserted] = await tx.insert(courses)
                    .values({
                        year: item.year,
                        term: item.term,
                        courseCode: item.courseCode,
                        rgNo: item.rgNo,
                        titleJa: item.titleJa,
                        titleEn: item.titleEn,
                        instructor: item.instructor,
                        room: item.room,
                        language: item.language,
                        status: item.status || "active",
                        updatedAt: new Date().getTime(),
                    })
                    .onConflictDoUpdate({
                        target: [courses.year, courses.rgNo],
                        set: {
                            titleJa: item.titleJa,
                            titleEn: item.titleEn,
                            instructor: item.instructor,
                            room: item.room,
                            status: item.status || "active",
                            updatedAt: new Date().getTime(),
                        },
                    })
                    .returning({id: courses.id});

                const courseId = upserted.id;

                // 3. カテゴリの紐付け
                if (item.categoryId) {
                    // 既存の紐付けを一旦すべて削除（洗い替え）
                    // TODO - 手動で追加したカテゴリも消したくない場合は、条件を絞る必要あり
                    await tx.delete(courseToCategories)
                        .where(eq(courseToCategories.courseId, courseId));

                    // 最新のカテゴリを挿入
                    await tx.insert(courseToCategories)
                        .values({
                            courseId: courseId,
                            categoryId: item.categoryId,
                        });
                }

                // 4. スケジュールの更新
                await tx.delete(courseSchedules).where(eq(courseSchedules.courseId, courseId));

                if (item.schedules && item.schedules.length > 0) {
                    await tx.insert(courseSchedules).values(
                        item.schedules.map((s: any) => ({
                            courseId,
                            dayOfWeek: s.dayOfWeek,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            period: s.period,
                            isLong: s.isLong,
                            isAlternative: s.isAlternative,
                            altGroupId: s.altGroupId,
                        }))
                    );
                }
            } catch (err) {
                console.error(`❌ Error at rgNo ${item.rgNo}:`, err);
            }
        }
    });

    console.log("✅ Sync complete!");
}

runSeed();