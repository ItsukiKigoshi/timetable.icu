// src/lib/course/utils.ts
// Courseに関連する関数・型を定義するヘルパー

import type {Course} from "@/db/schema";

export const getSyllabusUrl = (
    rgNo: string,
    year: number,
    term: Course["term"] | string
) => {
    const termMap: Record<string, number> = {
        Spring: 1,
        Autumn: 2,
        Winter: 3,
    };
    const termNum = termMap[term] ?? 0;
    const params = new URLSearchParams({
        regno: rgNo,
        year: year.toString(),
        term: termNum.toString(),
    });
    return `https://campus.icu.ac.jp/public/ehandbook/PreviewSyllabus.aspx?${params.toString()}`;
};

/**
 * 単位数を "整数+分数" 形式でフォーマットする
 * 例: 2.333 -> "2+1/3", 0.666 -> "2/3" (または "0+2/3")
 */
export const formatUnits = (units: number): string => {
    const integerPart = Math.floor(units);
    const decimalPart = units - integerPart;

    let fraction = "";
    // 許容誤差範囲を 0.02 程度に設定
    if (decimalPart > 0.31 && decimalPart < 0.35) {
        fraction = "1/3";
    } else if (decimalPart > 0.64 && decimalPart < 0.68) {
        fraction = "2/3";
    }

    if (fraction) {
        return integerPart > 0 ? `${integerPart}+${fraction}` : fraction;

        // 常に "整数+分数" 形式にする場合
        // return `${integerPart}+${fraction}`;
    }

    // 小数点以下がない、または特殊な分数でない場合は通常の数値を文字列で返す
    return units.toString();
};
