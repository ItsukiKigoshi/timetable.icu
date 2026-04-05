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
     // 限りなく整数に近い場合は、まずその整数に丸める
     // 例: 0.9999999998 -> 1.0
     const roundedUnits = Math.abs(Math.round(units) - units) < 0.000001 
                          ? Math.round(units) 
                          : units;
 
     const integerPart = Math.floor(roundedUnits);
     const decimalPart = roundedUnits - integerPart;
 
     // 整数になった場合は，そのまま文字列を返して終了
     if (decimalPart < 0.000001) {
         return integerPart.toString();
     }
 
     let fraction = "";
     // 分数の判定（許容誤差を考慮）
     if (Math.abs(decimalPart - 1/3) < 0.01) {
         fraction = "1/3";
     } else if (Math.abs(decimalPart - 2/3) < 0.01) {
         fraction = "2/3";
     }
 
     if (fraction) {
         return integerPart > 0 ? `${integerPart}+${fraction}` : fraction;
     }
 
     return roundedUnits.toString();
 };