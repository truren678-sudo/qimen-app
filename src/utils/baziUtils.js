import { Solar, Lunar } from 'lunar-javascript';
import { getQimenEightChar } from '../qimen';

/**
 * 反推八字對應的西曆時間
 * 日柱採奇門的晚子時換日規則：23:00 起屬隔天日柱。
 * @param {string} yearGz 年干支
 * @param {string} monthGz 月干支
 * @param {string} dayGz 日干支
 * @param {string} hourGz 時干支
 * @returns {Array} 包含所有符合條件的 Date 物件的陣列
 */
export function findSolarFromBazi(yearGz, monthGz, dayGz, hourGz) {
    let results = [];
    // 搜尋過去 ~100 年到未來 ~20 年 (涵蓋兩個甲子)
    const startYear = 1801;
    const endYear = 2099;

    for (let y = startYear; y <= endYear; y++) {
        let testLunarYear = Lunar.fromYmd(y, 1, 1);
        if (testLunarYear.getYearInGanZhi() === yearGz || testLunarYear.getYearInGanZhiExact() === yearGz) {
            // 找到符合的年，接下來掃描該年附近的所有日子
            let d = Solar.fromYmd(y - 1, 12, 1);
            for (let i = 0; i < 400; i++) {
                let bazi = getQimenEightChar(d);

                if (bazi.getYear() === yearGz && bazi.getMonth() === monthGz && bazi.getDay() === dayGz) {
                    // 找到符合的年月日，檢查時辰：每個時辰取一個代表時間，
                    // 晚子時則是前一個曆日的 23:00（日柱已換成本日）。
                    const prev = d.next(-1);
                    const candidates = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
                        .map(h => [d, h])
                        .concat([[prev, 23]]);
                    for (const [cd, h] of candidates) {
                        const hourBazi = getQimenEightChar(Solar.fromYmdHms(cd.getYear(), cd.getMonth(), cd.getDay(), h, 0, 0));
                        if (
                            hourBazi.getYear() === yearGz &&
                            hourBazi.getMonth() === monthGz &&
                            hourBazi.getDay() === dayGz &&
                            hourBazi.getTime() === hourGz
                        ) {
                            results.push(new Date(cd.getYear(), cd.getMonth() - 1, cd.getDay(), h, h === 23 ? 0 : 30));
                        }
                    }
                }
                d = d.next(1);
            }
        }
    }
    return results;
}
