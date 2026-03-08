const { Solar, Lunar } = require('lunar-javascript');

// 節氣序列 (24節氣)
const JQ_NAMES = [
    '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種',
    '夏至', '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
];

const JQ_JU = {
    '冬至': { isYin: false, ju: [1, 7, 4] }, '小寒': { isYin: false, ju: [2, 8, 5] }, '大寒': { isYin: false, ju: [3, 9, 6] },
    '立春': { isYin: false, ju: [8, 5, 2] }, '雨水': { isYin: false, ju: [9, 6, 3] }, '驚蟄': { isYin: false, ju: [1, 7, 4] },
    '春分': { isYin: false, ju: [3, 9, 6] }, '清明': { isYin: false, ju: [4, 1, 7] }, '穀雨': { isYin: false, ju: [5, 2, 8] },
    '立夏': { isYin: false, ju: [4, 1, 7] }, '小滿': { isYin: false, ju: [5, 2, 8] }, '芒種': { isYin: false, ju: [6, 3, 9] },
    '夏至': { isYin: true, ju: [9, 3, 6] }, '小暑': { isYin: true, ju: [8, 2, 5] }, '大暑': { isYin: true, ju: [7, 1, 4] },
    '立秋': { isYin: true, ju: [2, 5, 8] }, '處暑': { isYin: true, ju: [1, 4, 7] }, '白露': { isYin: true, ju: [9, 3, 6] },
    '秋分': { isYin: true, ju: [7, 1, 4] }, '寒露': { isYin: true, ju: [6, 9, 3] }, '霜降': { isYin: true, ju: [5, 8, 2] },
    '立冬': { isYin: true, ju: [6, 9, 3] }, '小雪': { isYin: true, ju: [5, 8, 2] }, '大雪': { isYin: true, ju: [4, 7, 1] }
};

// 取得兩個日期相差的天數 (忽略時分秒)
function getDaysDiff(d1, d2) {
    const t1 = Date.UTC(d1.getYear(), d1.getMonth() - 1, d1.getDay());
    const t2 = Date.UTC(d2.getYear(), d2.getMonth() - 1, d2.getDay());
    return Math.round((t2 - t1) / 86400000);
}

// 尋找最近的符頭 (甲子, 己卯, 甲午, 己酉 即上元)
function getNearestUpperYuan(solarDate) {
    const lunar = solarDate.getLunar();
    let baziDay = lunar.getEightChar().getDay(); // 干支，如 甲子

    // 尋找當前日子的干支在60甲子中的位置 (直接往前推算直到逢甲子/己卯/甲午/己酉)
    // 比較簡單的做法是直接找最近的距日
    let testDate = solarDate;
    let diff = 0;
    while (true) {
        const gz = testDate.getLunar().getEightChar().getDay();
        if (['甲子', '己卯', '甲午', '己酉'].includes(gz)) {
            // 找到前方的符頭
            break;
        }
        testDate = testDate.next(-1);
        diff++;
    }

    // 檢查要是往後找會不會更近?
    let testDate2 = solarDate;
    let diff2 = 0;
    while (true) {
        const gz = testDate2.getLunar().getEightChar().getDay();
        if (['甲子', '己卯', '甲午', '己酉'].includes(gz)) {
            break;
        }
        testDate2 = testDate2.next(1);
        diff2++;
    }

    if (diff2 < diff) {
        // 往後更近 (這也意味著超神/接氣的不同)
        return testDate2;
    }
    return testDate;
}

// 實作精確置閏算法
function calculateZhiRun(targetSolar) {
    // 為了安全涵蓋，取目標日期前一年的冬至作為起點 (或前兩年，為確保足夠覆蓋)
    const targetY = targetSolar.getYear();

    // 尋找上一年或前兩年的冬至
    // 我們可以從 目標日期前推 2 年的 12月21日 附近尋找冬至節氣
    let startAnchor = Solar.fromYmd(targetY - 1, 12, 1);
    let dongZhiSolar = null;
    let lunarAnchor = startAnchor.getLunar();

    // 找出該年真正的冬至
    let jq = lunarAnchor.getJieQiTable();
    for (const key of Object.keys(jq)) {
        if (key === '冬至' && jq[key].getYear() === targetY - 1) {
            dongZhiSolar = jq[key];
        }
    }

    if (!dongZhiSolar) {
        // 再往前找一年
        startAnchor = Solar.fromYmd(targetY - 2, 12, 1);
        lunarAnchor = startAnchor.getLunar();
        jq = lunarAnchor.getJieQiTable();
        for (const key of Object.keys(jq)) {
            if (key === '冬至') { dongZhiSolar = jq[key]; }
        }
    }

    if (!dongZhiSolar) {
        return null; // fallback
    }

    // 取得冬至最近的上元符頭
    let fuTou = getNearestUpperYuan(dongZhiSolar);

    // 開始步進推算
    let currentJQIdx = 0; // 對應 '冬至'
    let currentDate = fuTou;

    // 迴圈跑到涵蓋 targetSolar 為止
    let runLimit = 150; // 最大迴圈數，一年約 24 個氣，推演兩年約 48 個，150 綽綽有餘

    while (runLimit-- > 0) {
        // 當前節氣名稱
        let jqName = JQ_NAMES[currentJQIdx % 24];

        // 該節氣的天文交節點
        // 需要知道 currentDate 附近的真實交節點
        // ... lunar-javascript 裡面可以透過 `currentDate.getLunar().getPrevJieQi()` 等來查
        // 但我們只需要在芒種/大雪時查

        // 檢查是否要置閏
        let isRun = false;
        if (jqName === '芒種' || jqName === '大雪') {
            // 找出真實的芒種或大雪交節點在哪一天
            // 向前向後找
            let searchLunar = currentDate.getLunar();
            let realJQSolar = null;

            // 從 currentDate 往前/後找該節氣
            // ... (簡化，用月分大致找)
            // 置閏條件：超神(當前符頭 > 節氣) 超過 9 天。
            // 例如 currentDate(符頭) 早於 realJQSolar(節氣) 9 天以上
        }

        // 推演該節氣管轄的 15 天
        let endOfYuan = currentDate.next(15);

        if (getDaysDiff(currentDate, targetSolar) >= 0 && getDaysDiff(targetSolar, endOfYuan) > 0) {
            // 命中！目標日期在這 15 天內
            let diffDays = getDaysDiff(currentDate, targetSolar);
            let yuan = Math.floor(diffDays / 5); // 0:上, 1:中, 2:下

            // 回傳定局
            return {
                jieqiName: jqName,
                yuan: yuan,
                juNum: JQ_JU[jqName].ju[yuan],
                isYin: JQ_JU[jqName].isYin
            };
        }

        // 前進下一個節氣 (15天)
        currentDate = endOfYuan;
        if (!isRun) {
            currentJQIdx++;
        }
    }
    return null;
}

const s1 = Solar.fromYmdHms(2025, 7, 25, 20, 23, 0); // User requested 
console.log(calculateZhiRun(s1));
