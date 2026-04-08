import json


def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, int):
        return str(val)
    # 文字列内の ' を '' に変換してエスケープ
    safe_val = str(val).replace("'", "''")
    return f"'{safe_val}'"


def generate_sql():
    try:
        with open('./scripts/out/dist_courses.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ dist_courses.json が見つかりません。")
        return

    output = [
        "-- Auto-generated SQL for D1 Sync (Simplified for Wrangler compatibility)",
        "PRAGMA foreign_keys = OFF;",
        "BEGIN TRANSACTION;"
    ]

    for item in data:
        # 1. courses テーブルへの Upsert
        # units カラムを追加。SQLiteの REAL 型なので、そのまま数値を入れます。
        units_val = item.get('units', 0.0)

        course_sql = f"""
        INSERT INTO courses (
            year, term, course_code, rg_no, title_ja, title_en, 
            instructor, room, language, status, units, updated_at
        )
        VALUES (
            {item['year']}, {escape_sql(item['term'])}, {escape_sql(item['courseCode'])}, 
            {escape_sql(item['rgNo'])}, {escape_sql(item['titleJa'])}, {escape_sql(item['titleEn'])}, 
            {escape_sql(item['instructor'])}, {escape_sql(item['room'])}, {escape_sql(item['language'])}, 
            {escape_sql(item['status'])}, {units_val}, strftime('%s', 'now')
        )
        ON CONFLICT(year, rg_no) DO UPDATE SET 
            title_ja=excluded.title_ja, 
            title_en=excluded.title_en, 
            instructor=excluded.instructor, 
            room=excluded.room, 
            status=excluded.status, 
            units=excluded.units, 
            updated_at=strftime('%s', 'now');
        """
        output.append(course_sql.strip())

        # 2. Category紐付け
        cat_id = item.get('categoryId')
        if cat_id:
            # 古い紐付けを一旦消す（重複防止）
            # TODO - 1つの授業に2個めのタグを手動追加してもこれがすべて消し去るので解決が必要
            del_cat = f"DELETE FROM course_to_categories WHERE course_id = (SELECT id FROM courses WHERE year={item['year']} AND rg_no={escape_sql(item['rgNo'])});"
            output.append(del_cat)

            link_sql = f"INSERT OR IGNORE INTO course_to_categories (course_id, category_id) " \
                       f"SELECT id, '{cat_id}' FROM courses WHERE year={item['year']} AND rg_no={escape_sql(item['rgNo'])};"
            output.append(link_sql)

        # 3. 既存スケジュールの削除
        delete_sch = f"DELETE FROM course_schedules WHERE course_id = (SELECT id FROM courses WHERE year={item['year']} AND rg_no={escape_sql(item['rgNo'])});"
        output.append(delete_sch)

        # 4. スケジュールの挿入
        for s in item.get('schedules', []):
            sch_sql = f"""
            INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, period, is_long, is_alternative, alt_group_id)
            SELECT id, {escape_sql(s['dayOfWeek'])}, {escape_sql(s['startTime'])}, {escape_sql(s['endTime'])}, 
                   {s['period']}, {1 if s.get('isLong') else 0}, {1 if s.get('isAlternative') else 0}, {escape_sql(s.get('altGroupId'))}
            FROM courses WHERE year={item['year']} AND rg_no={escape_sql(item['rgNo'])};
            """
            output.append(sch_sql.strip())

    output.append("COMMIT;")
    output.append("PRAGMA foreign_keys = ON;")

    with open('scripts/out/sync_courses.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    print(f"✅ Generated sync_courses.sql ({len(data)} courses)")


if __name__ == "__main__":
    generate_sql()
