import json
import re

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, (int, float)):
        return str(val)
    # 文字列内の ' を '' に変換してエスケープ
    safe_val = str(val).replace("'", "''")
    return f"'{safe_val}'"

def generate_sql():
    try:
        with open('./scripts/out/dist_courses.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except FileNotFoundError:
        print("❌ dist_courses.json が見つかりません。")
        return

    # --- 重複排除 (念のためPython側でも実施) ---
    seen_keys = set()
    data = []
    for item in raw_data:
        key = f"{item['year']}-{item.get('rgNo', '')}-{item['courseCode']}-{item['instructor']}"
        if key not in seen_keys:
            seen_keys.add(key)
            data.append(item)

    output = [
        "-- Auto-generated SQL for D1 Sync",
        "PRAGMA foreign_keys = OFF;",
        "BEGIN TRANSACTION;",
        # トランザクション開始時に、中途半端な空文字レコードがあれば一掃する
        "DELETE FROM courses WHERE rg_no IS NULL OR rg_no = '';"
    ]

    for item in data:
        # 1. 準備
        raw_rg_no = item.get('rgNo', '')
        instructor = item.get('instructor', '')
        course_code = item.get('courseCode', '')
        year = item.get('year')
        units_val = item.get('units', 0.0)

        # 教員名からTEMP IDを生成
        instr_part = re.sub(r'[^\w]', '', instructor)[:10].upper()
        dummy_rg_no = f"TEMP-{course_code}-{instr_part}".upper()

        # 削除・挿入の対象となる全てのキーをリストアップ
        keys_to_clean = [escape_sql(dummy_rg_no)]
        
        if raw_rg_no and raw_rg_no.strip() != "":
            keys_to_clean.append(escape_sql(raw_rg_no))
            rg_no_for_db = raw_rg_no
        else:
            rg_no_for_db = dummy_rg_no

        # DB特定用のWHERE句
        where_clause = f"year={year} AND rg_no={escape_sql(rg_no_for_db)}"

        # --- SQL生成 ---
        
        # 2. 衝突回避のための既存レコード削除
        # TEMP ID版と正式ID版、両方を一度に消すことで制約違反を絶対に起こさない
        output.append(f"DELETE FROM courses WHERE year={year} AND rg_no IN ({', '.join(keys_to_clean)});")

        # 3. メインテーブルへの挿入
        # ON CONFLICTを使わず、常にクリーンな状態にINSERTする
        course_sql = f"""
        INSERT INTO courses (
            year, term, course_code, rg_no, title_ja, title_en, 
            instructor, room, language, status, units, updated_at
        )
        VALUES (
            {year}, {escape_sql(item['term'])}, {escape_sql(course_code)}, 
            {escape_sql(rg_no_for_db)}, {escape_sql(item['titleJa'])}, {escape_sql(item['titleEn'])}, 
            {escape_sql(instructor)}, {escape_sql(item['room'])}, {escape_sql(item['language'])}, 
            {escape_sql(item['status'])}, {units_val}, strftime('%s', 'now')
        );
        """
        output.append(course_sql.strip())

        # 子テーブル操作用のサブクエリ
        # INSERT直後なので、このwhere_clauseで確実に1件ヒットする
        course_id_subquery = f"(SELECT id FROM courses WHERE {where_clause} LIMIT 1)"

        # 4. Category 紐付け
        cat_id = item.get('categoryId')
        if cat_id:
            output.append(f"DELETE FROM course_to_categories WHERE course_id = {course_id_subquery};")
            output.append(f"INSERT OR IGNORE INTO course_to_categories (course_id, category_id) SELECT id, '{cat_id}' FROM courses WHERE {where_clause} LIMIT 1;")

        # 5. Schedule 削除と挿入
        output.append(f"DELETE FROM course_schedules WHERE course_id = {course_id_subquery};")
        for s in item.get('schedules', []):
            sch_sql = f"""
            INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, period, is_long, is_alternative, alt_group_id)
            SELECT id, {escape_sql(s['dayOfWeek'])}, {escape_sql(s['startTime'])}, {escape_sql(s['endTime'])}, 
                   {s['period']}, {1 if s.get('isLong') else 0}, {1 if s.get('isAlternative') else 0}, {escape_sql(s.get('altGroupId'))}
            FROM courses WHERE {where_clause} LIMIT 1;
            """
            output.append(sch_sql.strip())

    output.append("COMMIT;")
    output.append("PRAGMA foreign_keys = ON;")

    with open('scripts/out/sync_courses.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    print(f"✅ Generated sync_courses.sql ({len(data)} courses)")

if __name__ == "__main__":
    generate_sql()