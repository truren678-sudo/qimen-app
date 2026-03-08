import { Solar, Lunar } from 'lunar-javascript';

const JQ_NAMES_ORDER = [
    '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種',
    '夏至', '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
];

const JIEQI_JU = {
    '冬至': { isYin: false, ju: [1, 7, 4] }, '小寒': { isYin: false, ju: [2, 8, 5] }, '大寒': { isYin: false, ju: [3, 9, 6] },
    '立春': { isYin: false, ju: [8, 5, 2] }, '雨水': { isYin: false, ju: [9, 6, 3] }, '驚蟄': { isYin: false, ju: [1, 7, 4] },
    '春分': { isYin: false, ju: [3, 9, 6] }, '清明': { isYin: false, ju: [4, 1, 7] }, '穀雨': { isYin: false, ju: [5, 2, 8] },
    '立夏': { isYin: false, ju: [4, 1, 7] }, '小滿': { isYin: false, ju: [5, 2, 8] }, '芒種': { isYin: false, ju: [6, 3, 9] },
    '夏至': { isYin: true, ju: [9, 3, 6] }, '小暑': { isYin: true, ju: [8, 2, 5] }, '大暑': { isYin: true, ju: [7, 1, 4] },
    '立秋': { isYin: true, ju: [2, 5, 8] }, '處暑': { isYin: true, ju: [1, 4, 7] }, '白露': { isYin: true, ju: [9, 3, 6] },
    '秋分': { isYin: true, ju: [7, 1, 4] }, '寒露': { isYin: true, ju: [6, 9, 3] }, '霜降': { isYin: true, ju: [5, 8, 2] },
    '立冬': { isYin: true, ju: [6, 9, 3] }, '小雪': { isYin: true, ju: [5, 8, 2] }, '大雪': { isYin: true, ju: [4, 7, 1] }
};

function getDaysDiff(d1, d2) {
    const t1 = Date.UTC(d1.getYear(), d1.getMonth() - 1, d1.getDay());
    const t2 = Date.UTC(d2.getYear(), d2.getMonth() - 1, d2.getDay());
    return Math.round((t2 - t1) / 86400000);
}

function getFuTou(solarDate) {
    let d = solarDate;
    while (true) {
        const gz = d.getLunar().getEightChar().getDay();
        const gan = gz.charAt(0);
        if (gan === '甲' || gan === '己') return d;
        d = d.next(-1);
    }
}

function getZhiRunJieQi(targetSolar) {
    let anchorYear = targetSolar.getYear() - 1;
    let dongZhi = null;

    // Find the DongZhi of the previous year
    let dec21 = Solar.fromYmd(anchorYear, 12, 21);
    let lunar = dec21.getLunar();
    let jq = lunar.getPrevJieQi(true);
    if (jq.getName() !== '冬至') {
        jq = lunar.getNextJieQi(true);
    }
    dongZhi = jq.getSolar();

    let anchorFuTou = getFuTou(dongZhi);
    while (!['子', '午', '卯', '酉'].includes(anchorFuTou.getLunar().getEightChar().getDay().charAt(1))) {
        anchorFuTou = getFuTou(anchorFuTou.next(-1));
    }

    // Nearest Upper-Yuan check
    let nextUpper = anchorFuTou.next(15);
    if (Math.abs(getDaysDiff(dongZhi, nextUpper)) <= Math.abs(getDaysDiff(dongZhi, anchorFuTou))) {
        anchorFuTou = nextUpper;
    }

    console.log("Anchor DongZhi:", dongZhi.toYmd(), " Anchor FuTou:", anchorFuTou.toYmd());
    let curr = anchorFuTou;
    let jqIdx = 0;
    let isRun = false;
    let limit = 200; // prevent infinite loop

    while (limit-- > 0) {
        let currentJqName = JQ_NAMES_ORDER[jqIdx];

        let diffToTarget = getDaysDiff(curr, targetSolar);
        if (diffToTarget >= 0 && diffToTarget < 15) {
            let yuan = Math.floor(diffToTarget / 5);
            const info = JIEQI_JU[currentJqName];
            return {
                jieqiName: isRun ? `閏${currentJqName}` : currentJqName,
                yuan: yuan,
                juNum: info.ju[yuan],
                isYin: info.isYin,
                daysSince: diffToTarget
            };
        }

        // Next iteration setup
        if (!isRun && (currentJqName === '芒種' || currentJqName === '大雪')) {
            // Find astronomical date
            let trueJqSolar = null;
            let searchStart = curr.next(-15);
            for (let i = 0; i < 45; i++) {
                let d = searchStart.next(i);
                if (d.getLunar().getJieQi() === currentJqName) {
                    trueJqSolar = d;
                    break;
                }
            }

            if (trueJqSolar) {
                let chaoShenDays = getDaysDiff(curr, trueJqSolar);
                if (chaoShenDays >= 9) {
                    console.log(`[置閏觸發] 節氣: ${currentJqName}, 交節點: ${trueJqSolar.toYmd()}, 符頭: ${curr.toYmd()}, 超神天數: ${chaoShenDays}`);
                    isRun = true;
                    curr = curr.next(15);
                    continue;
                }
            }
        }

        isRun = false;
        curr = curr.next(15);
        jqIdx = (jqIdx + 1) % 24;
    }
    console.log("Failed to find target in range limit.");
}

const target = Solar.fromYmdHms(2017, 6, 20, 12, 0, 0); // 歷史上某個閏芒種期間?
console.log("Test 1 (2017-06-20):", getZhiRunJieQi(target));
const target2 = Solar.fromYmdHms(2025, 7, 25, 20, 23, 0);
console.log("Test 2 (2025-07-25):", getZhiRunJieQi(target2));
