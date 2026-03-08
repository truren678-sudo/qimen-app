import { calculateQimen, getSiZhu, TIAN_GAN, DI_ZHI } from './qimen';

// 五行生剋關係定義
// 金(0), 水(1), 木(2), 火(3), 土(4)
const WU_XING = {
    '金': 0, '水': 1, '木': 2, '火': 3, '土': 4
};

// 八門五行
const DOOR_WU_XING = {
    '休門': '水', '生門': '土', '傷門': '木', '杜門': '木',
    '景門': '火', '死門': '土', '驚門': '金', '開門': '金'
};

// 九宮五行
const PALACE_WU_XING = {
    1: '水', 2: '土', 3: '木', 4: '木',
    6: '金', 7: '金', 8: '土', 9: '火'
};

// 八門原始本位 (用於判斷伏吟/反吟)
const DOOR_ORIGIN_PALACE = {
    '休門': 1, '死門': 2, '傷門': 3, '杜門': 4,
    '開門': 6, '驚門': 7, '生門': 8, '景門': 9
};

// 判斷五行相剋 (A 剋 B)
// 木(2) 剋 土(4), 土(4) 剋 水(1), 水(1) 剋 火(3), 火(3) 剋 金(0), 金(0) 剋 木(2)
function isKe(a, b) {
    const keMap = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    return keMap[a] === b;
}

// 判斷五不遇時
// 時干剋日干 (陽剋陽，陰剋陰)，且為七殺
function isWuBuYuShi(dayGan, hourGan) {
    const wuBuYuMap = {
        '甲': '庚', '乙': '辛', '丙': '壬', '丁': '癸', '戊': '甲',
        '己': '乙', '庚': '丙', '辛': '丁', '壬': '戊', '癸': '己'
    };
    return wuBuYuMap[dayGan] === hourGan;
}

/**
 * 驗證宮位是否為「吉方」
 * @param {Object} palace - 九宮格對應的資料
 * @param {Object} chartResult - 整張排盤的結果資料
 * @returns {Object} { isAuspicious: boolean, reason: string[] }
 */
export function checkAuspiciousDirection(palace, chartResult) {
    const reasons = []; // 紀錄凶相原因
    let isAuspicious = false;

    // 1. 白名單判定 (四吉門)
    const goodDoors = ['休門', '生門', '開門', '景門'];
    if (goodDoors.includes(palace.door)) {
        isAuspicious = true;
    } else {
        // 非四吉門，直接判出局
        return { isAuspicious: false, reasons: ['非四吉門'] };
    }

    // --- 進入黑名單審查 ---

    // 1. 八神有白虎
    if (palace.shen === '白虎') {
        reasons.push('神遇白虎');
    }

    // 2. 門破與門制
    const doorWuxing = DOOR_WU_XING[palace.door];
    const palWuxing = PALACE_WU_XING[palace.num];
    if (doorWuxing && palWuxing) {
        if (isKe(doorWuxing, palWuxing)) {
            reasons.push('門迫(門剋宮)'); // 也可直接用原有的 palace.doorHarm === '迫'
        }
        if (isKe(palWuxing, doorWuxing)) {
            reasons.push('門制(宮剋門)');
        }
    }

    // 3. 門伏與門反
    const originPalace = DOOR_ORIGIN_PALACE[palace.door];
    if (originPalace) {
        if (originPalace === palace.num) {
            reasons.push('門伏吟');
        } else {
            // 對沖宮位
            const oppositeMap = { 1: 9, 2: 8, 3: 7, 4: 6, 6: 4, 7: 3, 8: 2, 9: 1 };
            if (oppositeMap[originPalace] === palace.num) {
                reasons.push('門反吟');
            }
        }
    }

    // 4. 天干擊刑
    if (palace.tianGanHarm && palace.tianGanHarm.includes('刑')) {
        reasons.push('天干擊刑');
    }
    // 地干擊刑也列入考慮
    if (palace.diGanHarm && palace.diGanHarm.includes('刑')) {
        reasons.push('地干擊刑');
    }

    // 5. 空亡
    if (chartResult.kongWang && typeof chartResult.kongWang === 'string') {
        const kwZhi = Array.from(chartResult.kongWang); // ex: ['戌', '亥']
        const DZ_PAL = { '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4, '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6 };
        const kwPals = kwZhi.map(z => DZ_PAL[z]);
        if (kwPals.includes(palace.num)) {
            reasons.push('空亡');
        }
    }

    // 6. 五不遇時 (僅適用於含有時柱推演的時家奇門，日家月家年家無此限)
    if (chartResult.chartType === '時家置閏') {
        const dayGan = chartResult.siZhu.dayGan;
        const hourGan = chartResult.siZhu.hourGan;
        if (isWuBuYuShi(dayGan, hourGan)) {
            reasons.push('五不遇時'); // 這會導致整個時辰的盤都不可用
        }
    }

    // 7. 日家奇門特有凶星 (咸池、招搖、攝提)
    if (chartResult.isDayQimen) {
        const badDayStars = ['咸池', '招搖', '攝提'];
        if (badDayStars.includes(palace.star)) {
            reasons.push(`日家凶星(${palace.star})`);
        }
    }

    // 若有任何凶相原因，則吉方不成立
    if (reasons.length > 0) {
        isAuspicious = false;
    }

    return { isAuspicious, reasons };
}

/**
 * 取得一整天的奇門曆資料 (涵蓋日盤與當日 12 時辰盤)
 */
export function getDailyAuspiciousData(year, month, day) {
    const dailyData = {
        date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        yearChart: null,
        monthChart: null,
        dayChart: null,
        hourCharts: []
    };

    // 計算年盤
    dailyData.yearChart = calculateQimen(year, month, day, 12, 0, { chartType: '年家奇門' });

    // 計算月盤
    dailyData.monthChart = calculateQimen(year, month, day, 12, 0, { chartType: '月家奇門' });

    // 計算日盤
    dailyData.dayChart = calculateQimen(year, month, day, 12, 0, { chartType: '日家奇門' });

    // 計算 12 個時辰盤 (以每個時辰中間點測試)
    const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]; // 子丑寅卯辰巳午未申酉戌亥 (早子)

    hours.forEach(hr => {
        const chart = calculateQimen(year, month, day, hr, 30, { chartType: '時家置閏' });
        if (chart) {
            // 為每個宮位加入過濾結果
            const processedPalaces = chart.palaces.map(p => {
                const filterResult = checkAuspiciousDirection(p, chart);
                return { ...p, filterResult };
            });

            // 計算時辰區間 (例如 hr=2 丑時，區間為 01:00-03:00)
            const startHour = hr === 0 ? 23 : hr - 1;
            const endHour = hr === 0 ? 1 : hr + 1;

            dailyData.hourCharts.push({
                hour: hr,
                timeRange: `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`,
                zhi: chart.siZhu.hourZhi,
                chart: { ...chart, palaces: processedPalaces }
            });
        }
    });

    // 為日盤等也壓上過濾結果
    ['yearChart', 'monthChart', 'dayChart'].forEach(key => {
        if (dailyData[key]) {
            dailyData[key].palaces = dailyData[key].palaces.map(p => ({
                ...p,
                filterResult: checkAuspiciousDirection(p, dailyData[key])
            }));
        }
    });

    return dailyData;
}
