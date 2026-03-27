import json
import re

def extract_prefixes():
    with open('dist_courses.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    prefixes = set()
    for item in data:
        code = item.get('courseCode', '')
        # 英字部分（JLP, ELA, ARTなど）を抽出
        match = re.match(r"([A-Z]+)", code)
        if match:
            prefixes.add(match.group(1))

    # アルファベット順に表示
    for p in sorted(list(prefixes)):
        print(p)

if __name__ == "__main__":
    extract_prefixes()