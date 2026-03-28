/**
 * 行為風水邏輯引擎
 * 根據九宮奇門2_第六堂課.txt 第三節原則生成行為指導
 */
import { checkAuspiciousDirection } from '../qimenCalendar';
import {
    BA_SHEN_DATA, JIU_XING_DATA, BA_MEN_DATA, TIAN_GAN_DATA,
    PALACE_INFO, HOUR_RANGE,
} from './behaviorFengShuiData';

const GOOD_DOORS = ['休門', '生門', '開門', '景門'];

/**
 * 生成行為風水指導
 * @param {Object} palace - 宮位資料物件
 * @param {Object} chartResult - 完整排盤結果
 * @returns {Object} 行為風水指導結果
 */
export function generateBehaviorGuide(palace, chartResult) {
    // 中宮不產生建議
    if (palace.num === 5) {
        return { status: 'no_good_door', message: '中宮（天禽寄坤二）不適用行為風水。' };
    }

    // Step 1: 吉門篩選
    if (!GOOD_DOORS.includes(palace.door)) {
        return {
            status: 'no_good_door',
            message: `此宮位為「${palace.door || '無門'}」，非四吉門（休/生/開/景），不適用行為風水。`,
        };
    }

    // Step 2: 凶格安全檢查 — 重用 qimenCalendar.js 的邏輯
    const auspCheck = checkAuspiciousDirection(palace, chartResult);
    if (auspCheck.reasons && auspCheck.reasons.length > 0) {
        return {
            status: 'blocked',
            blockReasons: auspCheck.reasons,
            message: '此宮位存在凶格，不建議執行行為風水。',
        };
    }

    // Step 3: 行為指令生成
    const palaceInfo = PALACE_INFO[palace.num] || {};
    const hourZhi = chartResult.siZhu?.hourZhi || '';
    const timeRange = HOUR_RANGE[hourZhi] || '';

    // 3a: 核心動作 — 以天干為主
    const tianGanInfo = TIAN_GAN_DATA[palace.tianGan] || null;
    const diGanInfo = TIAN_GAN_DATA[palace.diGan] || null;

    // 優先選有行為動作的天干作為主動作
    let primaryGan = null;
    let primaryGanData = null;
    let secondaryGan = null;
    let secondaryGanData = null;

    if (tianGanInfo && tianGanInfo.actions) {
        primaryGan = palace.tianGan;
        primaryGanData = tianGanInfo;
        if (diGanInfo) {
            secondaryGan = palace.diGan;
            secondaryGanData = diGanInfo;
        }
    } else if (diGanInfo && diGanInfo.actions) {
        primaryGan = palace.diGan;
        primaryGanData = diGanInfo;
        if (tianGanInfo) {
            secondaryGan = palace.tianGan;
            secondaryGanData = tianGanInfo;
        }
    } else {
        // 都沒行為動作，以天盤干為主
        primaryGan = palace.tianGan;
        primaryGanData = tianGanInfo;
        secondaryGan = palace.diGan;
        secondaryGanData = diGanInfo;
    }

    // 3b: 輔助修飾 — 神、星、門
    const auxiliary = [];
    const shenData = BA_SHEN_DATA[palace.shen];
    if (shenData) {
        const shenSuggestion = shenData.actions || shenData.traits;
        auxiliary.push({
            source: `${palace.shen}（八神）`,
            wuxing: shenData.wuxing,
            suggestion: shenSuggestion,
            items: shenData.items,
        });
    }

    const starName = (palace.star || '').replace(/\(.*\)/, '').replace(/（.*）/, '').trim();
    const starData = JIU_XING_DATA[starName];
    if (starData) {
        const starSuggestion = starData.actions || starData.traits;
        auxiliary.push({
            source: `${starName}（九星）`,
            wuxing: starData.wuxing,
            suggestion: starSuggestion,
            items: starData.items,
        });
    }

    const doorData = BA_MEN_DATA[palace.door];
    if (doorData) {
        const doorSuggestion = doorData.actions || doorData.traits;
        auxiliary.push({
            source: `${palace.door}（八門）`,
            wuxing: doorData.wuxing,
            suggestion: doorSuggestion,
            items: doorData.items,
        });
    }

    // 3c: 次數
    const repeatCount = palaceInfo.number || 1;

    // 3d: 觀想指引
    const doorVisualization = {
        '休門': '想像辦事過程輕鬆順利、心情愉悅放鬆',
        '生門': '想像財運亨通、事業蓬勃發展、生生不息',
        '開門': '想像工作事業順利開展、大門敞開、機會來臨',
        '景門': '想像未來美好的畫面，願景實現、心想事成',
    };
    const visualization = doorVisualization[palace.door] || '想像此次辦事能圓滿順利成功';

    // 3e: 輕微安全提示
    let safetyNote = '';
    if (palace.tianGanHarm === '墓' || palace.diGanHarm === '墓') {
        safetyNote = '此宮有入墓跡象，行為動作宜更加專注用心。';
    }

    return {
        status: 'ok',
        timeRange,
        hourZhi,
        direction: palaceInfo.direction || '',
        palaceName: `${palaceInfo.name || ''}${palace.num}宮`,
        palaceWuxing: palaceInfo.wuxing || '',
        coreAction: {
            primaryGan,
            primaryActions: primaryGanData?.actions || '',
            primaryTraits: primaryGanData?.traits || '',
            primaryItems: primaryGanData?.items || '',
            secondaryGan,
            secondaryActions: secondaryGanData?.actions || '',
            secondaryTraits: secondaryGanData?.traits || '',
            secondaryItems: secondaryGanData?.items || '',
        },
        auxiliary,
        repeatCount,
        visualization,
        safetyNote,
        // 原始符號供 UI 顯示
        symbols: {
            shen: palace.shen,
            star: starName,
            door: palace.door,
            tianGan: palace.tianGan,
            diGan: palace.diGan,
        },
    };
}
