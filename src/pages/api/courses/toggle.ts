import {toggleCourse} from "@/lib/course-actions";
import {drizzle} from 'drizzle-orm/d1';
import {env} from "cloudflare:workers";
import {getAuth} from "@/lib/auth";
import type {APIRoute} from "astro";
import * as schema from "@/db/schema.ts";

const auth = getAuth(env);


export const POST: APIRoute = async ({request}) => {
    const session = await auth.api.getSession({headers: request.headers});
    if (!session) return new Response(null, {status: 401});

    const body = (await request.json()) as { courseId: number };
    const {courseId} = body;

    const db = drizzle(env.timetable_icu, {schema});


    console.log(db, session.user.id, courseId);

    try {
        await toggleCourse(db, session.user.id, courseId);
        return new Response(JSON.stringify({success: true}), {
            status: 200,
            headers: {'Content-Type': 'application/json'}
        });
    } catch (error) {
        return new Response(JSON.stringify({error: 'Failed to toggle course'}), {
            status: 500
        });
    }
};