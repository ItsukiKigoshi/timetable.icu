import type {APIRoute} from "astro";
import {drizzle} from "drizzle-orm/d1";
import * as schema from "@/db/schema.ts";
import {and, eq} from "drizzle-orm";
import {env} from "cloudflare:workers";

//--- POST (Toggle Enrollment) ---
export const POST: APIRoute = async ({request, locals}) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({error: "Unauthorized"}), {status: 401});
    }

    try {
        const {courseId} = (await request.json()) as { courseId: number };
        if (!courseId) {
            return new Response(JSON.stringify({error: "Missing courseId"}), {status: 400});
        }

        const db = drizzle(env.timetable_icu, {schema});

        // 既存の登録があるか確認
        const existing = await db
            .select()
            .from(schema.userCourses)
            .where(
                and(
                    eq(schema.userCourses.userId, user.id),
                    eq(schema.userCourses.courseId, courseId)
                )
            )
            .get();

        if (existing) {
            // すでに存在する場合は削除 (Toggle OFF)
            await db
                .delete(schema.userCourses)
                .where(
                    and(
                        eq(schema.userCourses.userId, user.id),
                        eq(schema.userCourses.courseId, courseId)
                    )
                );
            return new Response(JSON.stringify({success: true, action: "removed"}), {status: 200});
        } else {
            // 存在しない場合は追加 (Toggle ON)
            await db.insert(schema.userCourses).values({
                userId: user.id,
                courseId: courseId,
            });
            return new Response(JSON.stringify({success: true, action: "added"}), {status: 201});
        }
    } catch (e) {
        return new Response(JSON.stringify({error: "Internal Server Error"}), {status: 500});
    }
};

// --- PATCH (Update Metadata like isVisible) ---
export const PATCH: APIRoute = async ({request, locals}) => {
    const user = locals.user;
    if (!user) return new Response(JSON.stringify({error: "Unauthorized"}), {status: 401});

    try {
        const {courseId, isVisible} = (await request.json()) as { courseId: number; isVisible?: boolean };
        if (courseId === undefined || isVisible === undefined) {
            return new Response(JSON.stringify({error: "Missing fields"}), {status: 400});
        }

        const db = drizzle(env.timetable_icu, {schema});

        // 指定されたユーザーの特定のコースを更新
        const result = await db.update(schema.userCourses)
            .set({
                isVisible: isVisible ?? true // 他に memo などが増えたらここに追加
            })
            .where(
                and(
                    eq(schema.userCourses.userId, user.id),
                    eq(schema.userCourses.courseId, courseId)
                )
            )
            .returning(); // 更新されたレコードを確認したい場合

        if (result.length === 0) {
            return new Response(JSON.stringify({error: "Course not found in user's list"}), {status: 404});
        }

        return new Response(JSON.stringify({success: true, isVisible}), {status: 200});
    } catch (e) {
        return new Response(JSON.stringify({error: "Internal Server Error"}), {status: 500});
    }
};