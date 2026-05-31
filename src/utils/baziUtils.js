import { Solar, Lunar } from 'lunar-javascript';

/**
 * 反推八字對應的西曆時間
 * @param {string} yearGz 年干支
 * @param {string} monthGz 月干支
 * @param {string} dayGz 日干支
 * @param {string} hourGz 時干支
 * @returns {Array} 包含所有符合條件的 Date 物件的陣列
 */
export function findSolarFromBazi(yearGz, monthGz, dayGz, hourGz) {
    let results = [];
    const currentYear = new Date().getFullYear();
    // 搜尋過去 ~100 年到未來 ~20 年 (涵蓋兩個甲子)
    const startYear = 1801;
    const endYear = 2099;

    for (let y = startYear; y <= endYear; y++) {
        let testLunarYear = Lunar.fromYmd(y, 1, 1);
        if (testLunarYear.getYearInGanZhi() === yearGz || testLunarYear.getYearInGanZhiExact() === yearGz) {
            // 找到符合的年，接下來掃描該年附近的所有日子
            let d = Solar.fromYmd(y - 1, 12, 1); 
            for (let i = 0; i < 400; i++) {
                let lunar = d.getLunar();
                let bazi = lunar.getEightChar();
                
                if (bazi.getYear() === yearGz && bazi.getMonth() === monthGz && bazi.getDay() === dayGz) {
                    // 找到符合的年月日，檢查時辰
                    // 檢查 0-23 時
                    for (let h = 0; h < 24; h += 2) {
                        let hourLunar = Solar.fromYmdHms(d.getYear(), d.getMonth(), d.getDay(), h, 0, 0).getLunar();
                        if (hourLunar.getEightChar().getTime() === hourGz) {
                            // 找到符合的時間！
                            // 通常時辰跨兩小時，我們取中間值或起始點，這裡取該時辰的起始 (例如子時取 0 點, 丑時取 2 點)
                            // 修正：夜子時與早子時可能跨日，但 lunar-javascript 會處理。
                            results.push(new Date(d.getYear(), d.getMonth() - 1, d.getDay(), h, 30));
                        }
                    }
                }
                d = d.next(1);
            }
        }
    }
    return results;
}
