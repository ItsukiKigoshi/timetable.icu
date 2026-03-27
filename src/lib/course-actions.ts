import {and, eq} from 'drizzle-orm';
import * as schema from '@/db/schema';

export async function toggleCourse(db: any, userId: string, courseId: number) {
    const existing = await db.query.userCourses.findFirst({
        where: and(
            eq(schema.userCourses.userId, userId),
            eq(schema.userCourses.courseId, courseId)
        ),
    });

    if (existing) {
        await db.delete(schema.userCourses).where(eq(schema.userCourses.id, existing.id));
        return {action: 'removed'};
    } else {
        await db.insert(schema.userCourses).values({userId, courseId});
        return {action: 'added'};
    }
}