import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { courses, courseSchedules } from "./schema";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

async function runSeed() {
    const dbPath = process.argv[2];

    if (!dbPath) {
        console.error("❌ SQLite file path not provided.");
        process.exit(1);
    }

    console.log(`📁 Connecting to Bun SQLite: ${dbPath}`);

    // Bun標準のDatabaseクラスを使用
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    const dataPath = path.resolve(process.cwd(), "dist_courses.json");
    if (!fs.existsSync(dataPath)) {
        console.error("❌ dist_courses.json not found.");
        return;
    }

    const coursesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    console.log(`🚀 Syncing ${coursesData.length} courses...`);

    // Bun-SQLite でも transaction は使えます
    await db.transaction(async (tx) => {
        for (const item of coursesData) {
            try {
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
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: [courses.year, courses.rgNo],
                        set: {
                            titleJa: item.titleJa,
                            titleEn: item.titleEn,
                            instructor: item.instructor,
                            room: item.room,
                            status: item.status || "active",
                            updatedAt: new Date(),
                        },
                    })
                    .returning({ id: courses.id });

                const courseId = upserted.id;
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