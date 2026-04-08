import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {env} from "cloudflare:workers";
import {sql} from "drizzle-orm";

export const POST: APIRoute = async (context) => {
    const user = context.locals.user;

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await context.request.json() as { courseItems: any[] };
        const rawItems = Array.isArray(body?.courseItems) ? body.courseItems : [];
        const db = drizzle(env.timetable_icu, { schema });

        // 1. 正規科目（数値ID）とカスタム科目（文字列ID）の振り分け
        const normalItems: any[] = [];
        const customItems: any[] = [];

        rawItems.forEach(item => {
            const id = item.id;
            if (typeof id === 'string' && id.startsWith('custom-')) {
                customItems.push(item);
            } else if (!isNaN(Number(id))) {
                normalItems.push(item);
            }
        });

        // 2. 実行用クエリを格納する配列
        const batchQueries: any[] = [];

        // --- 正規科目の挿入/更新クエリ作成 ---
        if (normalItems.length > 0) {
            const normalValues = normalItems.map(item => ({
                userId: user.id,
                courseId: Number(item.courseId || item.id),
                isVisible: item.isVisible !== false,
                memo: item.memo || null,
                colorCustom: item.colorCustom || null,
            }));

            batchQueries.push(
                db.insert(schema.userCourses)
                    .values(normalValues)
                    .onConflictDoUpdate({
                        target: [schema.userCourses.userId, schema.userCourses.courseId],
                        set: {
                            isVisible: sql`excluded.is_visible`,
                            memo: sql`excluded.memo`,
                            colorCustom: sql`excluded.color_custom`
                        }
                    })
            );
        }

        // --- カスタム科目の挿入クエリ作成 ---
        if (customItems.length > 0) {
            const customValues = customItems.map(item => ({
                userId: user.id,
                title: item.title || item.titleJa || "Untitled",
                instructor: item.instructor || "",
                room: item.room || "",
                units: Number(item.units) || 0,
                year: item.year,
                term: item.term,
                colorCustom: item.colorCustom || null,
                memo: item.memo || null,
                isVisible: item.isVisible !== false,
                // schema.tsでschedulesがjsonb/json型として定義されていれば配列のままでOK
                schedules: item.schedules || [],
            }));

            batchQueries.push(
                db.insert(schema.customCourses).values(customValues)
            );
        }

        // 3. バッチ実行（queriesが1つ以上ある場合のみ）
        if (batchQueries.length > 0) {
            // 型定義上の制約を [any, ...any[]] へのキャストで解決
            await db.batch(batchQueries as [any, ...any[]]);
        }

        return new Response(JSON.stringify({
            success: true,
            syncedNormal: normalItems.length,
            syncedCustom: customItems.length
        }), { status: 200 });

    } catch (e: any) {
        console.error("Sync Error:", e);
        return new Response(JSON.stringify({
            error: e.message || "Sync failed",
            detail: e.cause?.message || String(e)
        }), { status: 500 });
    }
};