# icuMAP（非公開情報）経由のHTML解析
# https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx
# HTMLを./scripts/data/icumap/all_courses.htmlへ配置
import json
import os
from bs4 import BeautifulSoup
from utils import parse_full_schedule, parse_units, save_course_update_metadata, get_category_id_from_code


# --- HTML解析メイン関数 ---
def parse_icumap_html(html_content):
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

def run_parser():
    html_data = ""

    # 方法A: 既存の scrape モジュールを使う場合
    # import scrape
    # html_data = scrape.get_courses("all")

    # 方法B: 保存済みのHTMLファイルを読み込む場合 (推奨: デバッグしやすいため)
    file_path = "scripts/data/icumap/all_courses.html"  # ファイル名を合わせてください
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            html_data = f.read()
    else:
        print(f"Error: {file_path} が見つかりません。")
        exit()

    print(f"解析開始... 行数をスキャン中")
    results = parse_icumap_html(html_data)

    # 結果をJSONとして保存
    output_file = 'scripts/out/dist_courses.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    save_course_update_metadata()
    print(f"--- 解析完了 ---")
    print(f"総科目数: {len(results)}")
    print(f"出力先: {os.path.abspath(output_file)}")
    print("icumap parsing completed.")

# --- メイン実行部分 ---
if __name__ == "__main__":
    run_parser()