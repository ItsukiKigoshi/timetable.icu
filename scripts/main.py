import json
import os
import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup

# --- 定数・変換マップ ---
DAY_MAP = {
    'm': 'Mon', 'tu': 'Tue', 'w': 'Wed', 'th': 'Thu', 'f': 'Fri', 'sa': 'Sat', 'su': 'Sun',
    'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu', 'fri': 'Fri', 'sat': 'Sat', 'sun': 'Sun'
}

TERM_MAP = {
    'Autumn': 'Autumn', 'Winter': 'Winter', 'Spring': 'Spring'
}

PERIOD_TIMES = {
    1: ("08:45", "10:00"),
    2: ("10:10", "11:25"),
    3: ("11:35", "12:50"),
    4: ("14:00", "15:15"),
    5: ("15:25", "16:40"),
    6: ("16:50", "18:05"),
    7: ("18:15", "19:30"),
}


# --- スケジュール解析ロジック ---
def parse_full_schedule(schedule_raw):
    if not schedule_raw or schedule_raw.strip() == "":
        return []

    alt_match = re.search(r'<(.*)>', schedule_raw)
    core_str = schedule_raw
    alt_groups_str = []
    if alt_match:
        core_str = schedule_raw.replace(alt_match.group(0), "").strip(', ')
        alt_groups_str = [g.strip() for g in alt_match.group(1).split('or')]

    raw_segments = []
    for p in re.split(r',', core_str):
        p = p.strip()
        if '/' in p: raw_segments.append({"text": p, "isAlternative": False, "altGroupId": None})
    for i, group in enumerate(alt_groups_str):
        group_id = i + 1
        for p in re.split(r',', group):
            p = p.strip()
            if '/' in p: raw_segments.append({"text": p, "isAlternative": True, "altGroupId": group_id})

    final_schedules = []
    for item in raw_segments:
        text = item["text"].lower()
        is_long = False
        if text.startswith('*'):
            is_long = True
            text = text[1:]

        try:
            period_str, day_raw = text.split('/', 1)
            period = int(period_str)
            day_of_week = DAY_MAP.get(day_raw, "Mon")

            # デフォルトの時間を取得
            start_t, end_t = PERIOD_TIMES.get(period, ("00:00", "00:00"))

            if is_long:
                if period == 4:
                    start_t, end_t = ("13:20", "15:15")
                elif period == 5:
                    start_t, end_t = ("15:25", "17:20")
                elif period == 7:
                    start_t, end_t = ("18:15", "20:10")

            final_schedules.append({
                "dayOfWeek": day_of_week,
                "startTime": start_t,
                "endTime": end_t,
                "period": period,
                "isLong": is_long,
                "isAlternative": item["isAlternative"],
                "altGroupId": item["altGroupId"]
            })
        except (ValueError, KeyError):
            continue

    return final_schedules


# Unitsを取り出す
def parse_units(s):
    """
    ICUの単位表記を数値(float)に変換する
    - "2" -> 2.0
    - "1/3" -> 0.3333...
    - "3/(9)" -> 3.0 (括弧内のコマ数は無視)
    - "(9)" -> 0.0 (単位としての実体がない場合)
    """
    if not s:
        return 0.0

    # 1. 括弧とその中身を削除 (例: "3/(9)" -> "3/")
    s_cleaned = re.sub(r'\(.*?\)', '', s).strip()

    # 2. 末尾に残る可能性があるスラッシュを削除 (例: "3/" -> "3")
    s_cleaned = s_cleaned.rstrip('/')

    if not s_cleaned:
        return 0.0

    try:
        # 分数形式 (1/3 など) の処理
        if '/' in s_cleaned:
            num, den = s_cleaned.split('/')
            return float(num) / float(den)
        # 通常の数値
        return float(s_cleaned)
    except (ValueError, ZeroDivisionError):
        return 0.0


# --- Category判定 ---
def get_category_id_from_code(course_code):
    # 先頭の英字部分を抽出 (例: ELA010 -> ELA, JLP001 -> JLP)
    match = re.match(r"([A-Z]+)", course_code)
    if not match:
        return "C009"  # 不明な場合は Others

    prefix = match.group(1)

    # 1. 大学院科目 (Qから始まるもの)
    if prefix.startswith('Q'):
        return "GRAD"

    # 2. 一般教育科目 (GEから始まる GEX, GEN, GES... などすべて)
    if prefix.startswith('GE'):
        return "C003"

    # 3. 世界の言語 (Wから始まるもの)
    if prefix.startswith('W'):
        return "C005"

    # --- 4. 完全一致による特殊マッピング ---
    special_mapping = {
        "ELA": "C001",
        "JLP": "C002",
        "HPE": "C004",
        "ELG": "C010",
        "TCP": "C006",
        "CTP": "C007",
        "SLR": "C008",
        "STH": "MSTH",  # 卒業研究
    }

    if prefix in special_mapping:
        return special_mapping[prefix]

    # --- 5. メジャー科目 (M + Prefix) ---
    major_id = f"M{prefix}"

    # 存在するメジャーIDかチェックするためのセット
    valid_majors = {
        "MAMS", "MANT", "MARC", "MAST", "MBIO", "MBUS", "MCED", "MCHM",
        "MDPS", "MECO", "MEDU", "MEMS", "MENV", "MGLS", "MGSS", "MHST",
        "MIRL", "MISC", "MJPS", "MLAW", "MLED", "MLIT", "MLNG", "MMCC",
        "MMTH", "MMUS", "MPCS", "MPHR", "MPHY", "MPOL", "MPPL", "MPSY", "MSOC"
    }

    if major_id in valid_majors:
        return major_id

    # 5. どれにも当てはまらない場合
    return "C009"


# --- HTML解析メイン関数 ---
def get_course_data_json(html_content):
    soup = BeautifulSoup(html_content, 'lxml')
    # テーブルの各行(tr)を取得
    rows = soup.find_all('tr')

    res_list = []
    seen_rgno = set()  # 重複チェック用の集合

    for row in rows:
        # IDが "lbl_rgno" で終わる span を探す（インデックスに頼らない）
        rgno_tag = row.select_one('span[id$="_lbl_rgno"]')

        if not rgno_tag:
            continue

        rgno = rgno_tag.get_text(strip=True)

        # 1. 重複チェック：すでに処理した rgNo はスキップ
        if rgno in seen_rgno:
            # デバッグ用に重複があったことを通知（必要なければ消してOK）
            print(f"⚠️ Skipping duplicate rgNo: {rgno}")
            continue

        # 2. バリデーション：rgNo が空、または数字以外（ヘッダー行など）ならスキップ
        if not rgno.isdigit():
            continue

        # 重複リストに登録
        seen_rgno.add(rgno)

        # 3. IDのプレフィックスを動的に作成 (例: ctl00_..._ctl02_lbl_)
        base_id = rgno_tag['id'].replace('lbl_rgno', 'lbl_')

        # 4. 開講中止(Cancelled)の判定
        # 「日本語科目名」の span またはその親要素に 'word_line_through' クラスがあるか確認
        title_ja_tag = row.find('span', id=base_id + "title_j")
        is_cancelled = False
        if title_ja_tag:
            # span 自体のクラスを確認
            has_strike_class = "word_line_through" in (title_ja_tag.get('class') or [])
            # 親要素(divなど)のクラスを確認
            parent_has_strike = "word_line_through" in (title_ja_tag.parent.get('class') or [])
            is_cancelled = has_strike_class or parent_has_strike

        # ヘルパー関数：指定したラベルのテキストを取得
        def get_text(label):
            tag = row.find('span', id=base_id + label)
            return tag.get_text(strip=True) if tag else ""

        # 5. オブジェクトの組み立て
        course_code = get_text("course_no")  # 変数に入れておく

        # 単位数
        unit_str = get_text("unit")

        # カテゴリIDを判定
        cat_id = get_category_id_from_code(course_code)

        course_obj = {
            "rgNo": rgno,
            "status": "cancelled" if is_cancelled else "active",
            "year": int(get_text("ay") or 2026),
            "term": get_text("season"),
            "courseCode": course_code,
            "titleJa": get_text("title_j"),
            "titleEn": get_text("title_e"),
            "instructor": get_text("instructor"),
            "room": get_text("room"),
            "language": get_text("lang"),
            "categoryId": cat_id,
            "units": parse_units(unit_str),
            "schedules": parse_full_schedule(get_text("schedule")) if get_text("schedule") else []
        }

        res_list.append(course_obj)

    return res_list

# --- メタデータ（更新日時）保存用 ---
COURSE_UPDATE_INFO_PATH = './src/db/course-last-update.json'

def save_course_update_metadata():
    """
    コースデータの更新メタデータ（最新日時と全履歴）をUTCで保存する。
    """
    # 1. 現在時刻をUTCで取得 (ISO 8601形式)
    now_utc = datetime.now(timezone.utc).isoformat()

    # 2. 既存の履歴を読み込み
    history = []
    if os.path.exists(COURSE_UPDATE_INFO_PATH):
        try:
            with open(COURSE_UPDATE_INFO_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 過去のデータ形式との互換性を確保
                current_history = data.get("history", [])
                if isinstance(current_history, list):
                    history = current_history
                elif isinstance(current_history, str):
                    history = [current_history]
        except Exception as e:
            print(f"Warning: 履歴の読み込みに失敗しました (新規作成します): {e}")

    # 3. 重複していなければ先頭に追加
    if now_utc not in history:
        history.insert(0, now_utc)

    # 4. 保存用データ構造
    update_data = {
        "courseLastUpdatedAt": now_utc,
        "history": history
    }

    # 5. ディレクトリ作成と保存
    try:
        os.makedirs(os.path.dirname(COURSE_UPDATE_INFO_PATH), exist_ok=True)
        with open(COURSE_UPDATE_INFO_PATH, 'w', encoding='utf-8') as f:
            json.dump(update_data, f, ensure_ascii=False, indent=2)

        print(f"--- Metadata Updated ---")
        print(f"Latest (UTC): {now_utc}")
        print(f"History count: {len(history)}")
    except Exception as e:
        print(f"Error: メタデータの保存に失敗しました: {e}")


# --- メイン実行部分 ---
if __name__ == "__main__":
    html_data = ""

    # 方法A: 既存の scrape モジュールを使う場合
    # import scrape
    # html_data = scrape.get_courses("all")

    # 方法B: 保存済みのHTMLファイルを読み込む場合 (推奨: デバッグしやすいため)
    file_path = "scripts/data/all_courses.html"  # ファイル名を合わせてください
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            html_data = f.read()
    else:
        print(f"Error: {file_path} が見つかりません。")
        exit()

    print(f"解析開始... 行数をスキャン中")
    results = get_course_data_json(html_data)

    # 結果をJSONとして保存
    output_file = 'scripts/out/dist_courses.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    save_course_update_metadata()
    print(f"--- 解析完了 ---")
    print(f"総科目数: {len(results)}")
    print(f"出力先: {os.path.abspath(output_file)}")

