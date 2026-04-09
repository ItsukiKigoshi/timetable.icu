# ehandbookとicuMAPから生成されたJSONファイルの差分を調査するためのPython Script
# 結果: ehandbookにはキャンセルされたコースと大学院コースが含まれていない
import json

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # rgNo をキーとした辞書に変換
        return {item['rgNo']: item for item in data if item['rgNo']}

def compare():
    path_eh = 'scripts/out/dist_courses_ehandbook.json'
    path_im = 'scripts/out/dist_courses_icumap.json'

    eh_data = load_json(path_eh)
    im_data = load_json(path_im)

    eh_keys = set(eh_data.keys())
    im_keys = set(im_data.keys())

    # 1. icumap にのみ存在する（ehandbook にない）
    only_im = im_keys - eh_keys
    # 2. ehandbook にのみ存在する（icumap にない）
    only_eh = eh_keys - im_keys

    print(f"--- 統計 ---")
    print(f"ehandbook 総数: {len(eh_keys)}")
    print(f"icuMAP    総数: {len(im_keys)}")
    print(f"差分（数）    : {abs(len(eh_keys) - len(im_keys))}")

    print(f"\n--- icuMAP にのみ存在 ({len(only_im)}件) ---")
    for k in sorted(list(only_im)):
        item = im_data[k]
        print(f"[{k}] {item['status']}\t{item['courseCode']} {item['titleJa']} - ({item['term']})")

    print(f"\n--- ehandbook にのみ存在 ({len(only_eh)}件) ---")
    for k in sorted(list(only_eh)):
        item = eh_data[k]
        print(f"[{k}] {item['status']}\t{item['courseCode']} - {item['titleJa']} - ({item['term']})")

if __name__ == "__main__":
    compare()