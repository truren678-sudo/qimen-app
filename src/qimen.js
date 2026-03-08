/**
 * 奇門遁甲核心計算模組 v3
 * 時家置閏法
 *
 * 主要流程：
 *  1. 查節氣定陰陽遁與局數
 *  2. 排地盤三奇六儀（陽順九宮、陰逆九宮）
 *  3. 找旬首宮定值符（星）、值使（門）
 *  4. 飛天盤九星與天干（星干隨時干，環形順轉）
 *  5. 飛八門（門隨時支飛九宮，環形順轉）
 *  6. 布八神（神隨值符星，陽順轉陰逆轉）
 */
import { Solar } from 'lunar-javascript';

// ===== 基礎常數 =====
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 三奇六儀排列順序
const LIU_YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

// 各宮原始屬性（地盤）
const PAL_STAR = { 1: '天蓬', 2: '天芮', 3: '天沖', 4: '天輔', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
const PAL_DOOR = { 1: '休門', 2: '死門', 3: '傷門', 4: '杜門', 5: '', 6: '開門', 7: '驚門', 8: '生門', 9: '景門' };
const BA_SHEN = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];

// 八宮環形順序（蓬任衝輔英芮柱心 對應 1,8,3,4,9,2,7,6）
const RING = [1, 8, 3, 4, 9, 2, 7, 6];

// 九宮佈局
export const PALACE_LAYOUT = [
    { num: 4, name: '巽', sym: '☴' }, { num: 9, name: '離', sym: '☲' }, { num: 2, name: '坤', sym: '☷' },
    { num: 3, name: '震', sym: '☳' }, { num: 5, name: '中', sym: '' }, { num: 7, name: '兌', sym: '☱' },
    { num: 8, name: '艮', sym: '☶' }, { num: 1, name: '坎', sym: '☵' }, { num: 6, name: '乾', sym: '☰' },
];

// 節氣定局（冬至起陽，夏至起陰；一氣三元）
const JIEQI_JU = {
    '冬至': { isYin: false, ju: [1, 7, 4] }, '小寒': { isYin: false, ju: [2, 8, 5] }, '大寒': { isYin: false, ju: [3, 9, 6] },
    '立春': { isYin: false, ju: [8, 5, 2] }, '雨水': { isYin: false, ju: [9, 6, 3] }, '驚蟄': { isYin: false, ju: [1, 7, 4] },
    '春分': { isYin: false, ju: [3, 9, 6] }, '清明': { isYin: false, ju: [4, 1, 7] }, '穀雨': { isYin: false, ju: [5, 2, 8] },
    '立夏': { isYin: false, ju: [4, 1, 7] }, '小滿': { isYin: false, ju: [5, 2, 8] }, '芒種': { isYin: false, ju: [6, 3, 9] },
    '夏至': { isYin: true, ju: [9, 3, 6] }, '小暑': { isYin: true, ju: [8, 2, 5] }, '大暑': { isYin: true, ju: [7, 1, 4] },
    '立秋': { isYin: true, ju: [2, 5, 8] }, '處暑': { isYin: true, ju: [1, 4, 7] }, '白露': { isYin: true, ju: [9, 3, 6] },
    '秋分': { isYin: true, ju: [7, 1, 4] }, '寒露': { isYin: true, ju: [6, 9, 3] }, '霜降': { isYin: true, ju: [5, 8, 2] },
    '立冬': { isYin: true, ju: [6, 9, 3] }, '小雪': { isYin: true, ju: [5, 8, 2] }, '大雪': { isYin: true, ju: [4, 7, 1] },
};

const YI_MA_MAP = {
    '申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申',
    '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳',
};

// 工具函數
function gzIdx(gan, zhi) {
    const g = TIAN_GAN.indexOf(gan), z = DI_ZHI.indexOf(zhi);
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    return 0;
}
function ringIdx(palNum) {
    return RING.indexOf(palNum === 5 ? 2 : palNum); // 中5一律寄坤2
}

// ── 年月日家定局與計算輔助函數 ──
function getYearQimenInfo(year) {
    const startYear = 1984; // 近代最近的一個甲子年
    let y = year;
    if (y < startYear) {
        y += Math.ceil((startYear - y) / 60) * 60;
    }
    const offset = (y - startYear) % 60; // 0-59
    const yuanOffset = Math.floor(offset / 20); // 0: 上元, 1: 中元, 2: 下元

    const yuanName = ['上元', '中元', '下元'][yuanOffset];
    const juNum = [1, 4, 7][yuanOffset]; // 陰一、陰四、陰七局
    return { juNum, isYin: true, yuanName };
}

function getMonthQimenInfo(siZhu) {
    // 依據傳統月家排盤法，直接以年支定局 (五年一元皆不變，實務上等同由所屬年的大元決定，但最簡化判定為年支)：
    // 子午卯酉: 陰七局 (上元)
    // 寅申巳亥: 陰一局 (中元)
    // 辰戌丑未: 陰四局 (下元)
    const zhiIdx = DI_ZHI.indexOf(siZhu.yearZhi);
    let baseJu = 7;
    let yuanName = '';

    if ([0, 3, 6, 9].includes(zhiIdx)) { // 子、午、卯、酉
        yuanName = '上元';
        baseJu = 7;
    } else if ([2, 5, 8, 11].includes(zhiIdx)) { // 寅、申、巳、亥
        yuanName = '中元';
        baseJu = 1;
    } else if ([1, 4, 7, 10].includes(zhiIdx)) { // 辰、戌、丑、未
        yuanName = '下元';
        baseJu = 4;
    }

    return { juNum: baseJu, isYin: true, yuanName };
}

// ── 日家休門太乙排盤法專屬 ──
function getRiJiaQimenPalaces(year, month, day, siZhu) {
    const target = new Date(year, month - 1, day);
    const xiazhi = new Date(year, 5, 21);
    const dongzhi_this = new Date(year, 11, 22);
    const dongzhi_prev = new Date(year - 1, 11, 22);

    let isYin = false;
    if (target >= dongzhi_prev && target < xiazhi) isYin = false;
    else if (target >= xiazhi && target < dongzhi_this) isYin = true;
    else isYin = false;

    const dayGzIdx = gzIdx(siZhu.dayGan, siZhu.dayZhi);
    const groupIdx = Math.floor(dayGzIdx / 3); // 0-19組
    const yangPalaces = [1, 2, 3, 4, 6, 7, 8, 9, 1, 2, 3, 4, 6, 7, 8, 9, 1, 2, 3, 4];
    const yinPalaces = [9, 8, 7, 6, 4, 3, 2, 1, 9, 8, 7, 6, 4, 3, 2, 1, 9, 8, 7, 6];

    const xiuPalace = isYin ? yinPalaces[groupIdx] : yangPalaces[groupIdx];
    const isYangGan = ['甲', '丙', '戊', '庚', '壬'].includes(siZhu.dayGan);

    const doors = ['休門', '生門', '傷門', '杜門', '景門', '死門', '驚門', '開門'];
    const doorRing = isYangGan ? RING : [...RING].reverse();
    const doorStartIdx = doorRing.indexOf(xiuPalace);
    const doorPan = { 5: '' };
    for (let i = 0; i < 8; i++) {
        doorPan[doorRing[(doorStartIdx + i) % 8]] = doors[i];
    }

    const DAY_STARS = ['太乙', '攝提', '軒轅', '招搖', '天符', '青龍', '咸池', '太陰', '天乙'];
    let taiYiStartPalace = (!isYin) ? ((8 + dayGzIdx - 1) % 9 + 1) : ((2 - (dayGzIdx % 9) + 9) % 9 || 9);

    // 排九星 (按九宮數字飛滿，陽遁順飛、陰遁逆飛)
    const starPalaceSeq = (!isYin) ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const starStartIdx = starPalaceSeq.indexOf(taiYiStartPalace);
    const starPan = {};
    for (let i = 0; i < 9; i++) {
        starPan[starPalaceSeq[(starStartIdx + i) % 9]] = DAY_STARS[i];
    }

    const xuns = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
    const xun_idx = Math.floor(dayGzIdx / 10);
    return { doorPan, starPan, isYin, xunName: xuns[xun_idx] };
}

// ── 1. 節氣定局 (時家置閏法精密推算) ──
const JQ_NAMES_ORDER = [
    '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種',
    '夏至', '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
];

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

function getJieQiInfo(targetSolar) {
    let anchorYear = targetSolar.getYear() - 1;
    let dongZhi = null;

    // 尋找前一年的冬至
    let dec21 = Solar.fromYmd(anchorYear, 12, 21);
    let lunar = dec21.getLunar();
    let jq = lunar.getPrevJieQi(true);
    if (jq.getName() !== '冬至') {
        jq = lunar.getNextJieQi(true);
    }
    dongZhi = jq.getSolar();

    // 尋找冬至對應的符頭 (上元)
    let anchorFuTou = getFuTou(dongZhi);
    while (!['子', '午', '卯', '酉'].includes(anchorFuTou.getLunar().getEightChar().getDay().charAt(1))) {
        anchorFuTou = getFuTou(anchorFuTou.next(-1));
    }

    // 判斷是正授、超神還是稍微接氣，找最近的上元符頭
    let nextUpper = anchorFuTou.next(15);
    if (Math.abs(getDaysDiff(dongZhi, nextUpper)) <= Math.abs(getDaysDiff(dongZhi, anchorFuTou))) {
        anchorFuTou = nextUpper;
    }

    let curr = anchorFuTou;
    let jqIdx = 0;
    let isRun = false;
    let limit = 200; // 安全機制防止無限迴圈

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

        // 準備下一步：判斷是否達到了芒種或大雪且超神大於等於9天，需要置閏一次
        if (!isRun && (currentJqName === '芒種' || currentJqName === '大雪')) {
            // 找出真實的天文交節點
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
                    isRun = true;
                    curr = curr.next(15);
                    continue; // 重新跑一次同樣的節氣 (置閏)
                }
            }
        }

        isRun = false;
        curr = curr.next(15);
        jqIdx = (jqIdx + 1) % 24;
    }
    // 備用方案回退
    return { jieqiName: '冬至', yuan: 0, juNum: 1, isYin: false };
}

// ── 2. 地盤 ──
function buildDiPan(juNum, isYin) {
    const seq = isYin ? [9, 8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const startI = seq.indexOf(juNum);
    const diPan = {};
    for (let i = 0; i < 9; i++) {
        diPan[seq[(startI + i) % 9]] = LIU_YI[i];
    }
    return diPan;
}

// ── 3. 旬首 ──
function getXunInfo(hourGan, hourZhi, diPan) {
    const tIdx = gzIdx(hourGan, hourZhi);
    const xunNo = Math.floor(tIdx / 10);
    const xunHeadGan = ['戊', '己', '庚', '辛', '壬', '癸'][xunNo];
    const xunPalNum = +Object.keys(diPan).find(k => diPan[k] === xunHeadGan) || 1;
    const xunHeadZhi = DI_ZHI[(xunNo * 10) % 12];
    return {
        xunNo, xunHeadGan, xunPalNum, xunHeadZhi,
        zhiFuXing: PAL_STAR[xunPalNum] || '天蓬',
        zhiShiMen: (xunPalNum === 5 ? '死門' : PAL_DOOR[xunPalNum]) || '休門',
    };
}

// ── 4. 天盤九星 & 天干 ──
function buildStarAndTianPan(diPan, xunInfo, hourGan) {
    const { xunPalNum } = xunInfo;
    // 時干若為甲，使用旬首干替代
    const searchGan = hourGan === '甲' ? xunInfo.xunHeadGan : hourGan;
    // 值符星飛到時干所在地盤宮位
    const targetPal = +Object.keys(diPan).find(k => diPan[k] === searchGan) || xunPalNum;

    const srcI = ringIdx(xunPalNum);
    const tgtI = ringIdx(targetPal);
    let offset = 0;
    if (srcI >= 0 && tgtI >= 0) offset = (tgtI - srcI + 8) % 8; // 天盤九星/干永遠順時針旋轉

    const starPan = {};
    const tianPan = {};
    RING.forEach((palNum, i) => {
        const origI = (i - offset + 8) % 8;
        starPan[palNum] = PAL_STAR[RING[origI]];
        tianPan[palNum] = diPan[RING[origI]];
    });
    starPan[5] = '天禽(寄坤2)';
    tianPan[5] = diPan[5] || ''; // 中宮天干隨5宮原本的地干（寄坤2）
    return { starPan, tianPan, timeStemPal: targetPal };
}

// ── 5. 人盤八門 ──
function buildDoorPan(diPan, xunInfo, hourZhi, isYin) {
    const { xunPalNum, xunHeadZhi } = xunInfo;
    const startZhiI = DI_ZHI.indexOf(xunHeadZhi);
    const currZhiI = DI_ZHI.indexOf(hourZhi);
    const steps = (currZhiI - startZhiI + 12) % 12;

    // 值使門依九宮順/逆飛尋找目標落宮
    let targetPal = xunPalNum;
    if (isYin) {
        targetPal = (xunPalNum - 1 - (steps % 9) + 9) % 9 + 1;
    } else {
        targetPal = (xunPalNum - 1 + steps) % 9 + 1;
    }

    const srcI = ringIdx(xunPalNum);
    const tgtI = ringIdx(targetPal);
    let offset = 0;
    if (srcI >= 0 && tgtI >= 0) offset = (tgtI - srcI + 8) % 8; // 八門環形永遠順排

    const doorPan = {};
    RING.forEach((palNum, i) => {
        const origI = (i - offset + 8) % 8;
        doorPan[palNum] = PAL_DOOR[RING[origI]];
    });
    doorPan[5] = '';
    return { doorPan, zhiShiPal: targetPal };
}

// ── 6. 神盤八神 ──
function buildShenPan(starPan, zhiFuXing, isYin) {
    // 小值符跟隨大值符(天盤星)，若值符為天禽，則跟隨天芮(寄坤2)
    const searchStar = zhiFuXing === '天禽' ? '天芮' : zhiFuXing;
    const zfPal = +Object.keys(starPan).find(k => starPan[k] === searchStar) || 1;
    const zfI = ringIdx(zfPal);

    const shenPan = {};
    RING.forEach((palNum, i) => {
        // 陽順陰逆
        const dist = isYin ? (zfI - i + 8) % 8 : (i - zfI + 8) % 8;
        shenPan[palNum] = BA_SHEN[dist];
    });
    shenPan[5] = '';
    return { shenPan };
}

// ===== 奇門四害判定 =====
function getHarmInfo(palaceNum, door, tianGan, diGan, tianGExtra, diGExtra) {
    let doorHarm = '';
    // 門迫
    const poMap = {
        1: ['生門', '死門'], 2: ['傷門', '杜門'], 3: ['開門', '驚門'], 4: ['開門', '驚門'],
        6: ['景門'], 7: ['景門'], 8: ['傷門', '杜門'], 9: ['休門']
    };
    if (poMap[palaceNum] && poMap[palaceNum].includes(door)) doorHarm = '迫';

    // 擊刑
    const xingMap = {
        3: ['戊'], 2: ['己'], 8: ['庚'], 9: ['辛'], 4: ['壬', '癸']
    };

    // 入墓 (乙丙戊在乾6, 丁己庚在艮8, 辛壬在巽4, 癸在坤2)
    const muMap = {
        6: ['乙', '丙', '戊'], 8: ['丁', '己', '庚'], 4: ['辛', '壬'], 2: ['癸']
    };

    const getGanHarm = (g) => {
        if (!g) return '';
        let isXing = xingMap[palaceNum] && xingMap[palaceNum].includes(g);
        let isMu = muMap[palaceNum] && muMap[palaceNum].includes(g);
        if (isXing && isMu) return '刑墓';
        if (isXing) return '刑';
        if (isMu) return '墓';
        return '';
    };

    return {
        doorHarm,
        tianGanHarm: getGanHarm(tianGan),
        diGanHarm: getGanHarm(diGan),
        tianGanExtraHarm: getGanHarm(tianGExtra),
        diGanExtraHarm: getGanHarm(diGExtra)
    };
}

// ===== 陰盤奇門定局 =====
// 晚子時（23:00起）傳統命理進入「隔日」，農曆日需進位
export function getYinPanJu(solar, siZhu) {
    // 若為晚子時(23:xx)，使用隔天的農曆資料計算
    const isLateZiShi = solar.getHour() >= 23;
    const lunarBase = isLateZiShi ? solar.next(1).getLunar() : solar.getLunar();

    const yearZhiIndex = DI_ZHI.indexOf(siZhu.yearZhi) + 1;
    const lunarMonth = Math.abs(lunarBase.getMonth());
    const lunarDay = lunarBase.getDay();
    const hourZhiIndex = DI_ZHI.indexOf(siZhu.hourZhi) + 1;

    const sum = yearZhiIndex + lunarMonth + lunarDay + hourZhiIndex;
    let juNum = sum % 9;
    if (juNum === 0) juNum = 9;

    const jqInfo = getJieQiInfo(solar);
    const isYin = jqInfo.isYin;
    return { juNum, isYin, yuanName: '陰盤' };
}

// ===== 四柱計算 =====
export function getSiZhu(year, month, day, hour, minute) {
    try {
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunar = solar.getLunar();
        const bazi = lunar.getEightChar();
        return {
            yearGan: bazi.getYearGan(), yearZhi: bazi.getYearZhi(),
            monthGan: bazi.getMonthGan(), monthZhi: bazi.getMonthZhi(),
            dayGan: bazi.getDayGan(), dayZhi: bazi.getDayZhi(),
            hourGan: bazi.getTimeGan(), hourZhi: bazi.getTimeZhi(),
            lunarYear: lunar.getYear(), lunarMonth: Math.abs(lunar.getMonth()),
            lunarDay: lunar.getDay(), isLeapMonth: lunar.getMonth() < 0,
            weekDay: new Date(year, month - 1, day).getDay(),
        };
    } catch (e) { return null; }
}

const XUN_NAMES = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
const XUN_KONG = { '甲子': '戌亥', '甲戌': '申酉', '甲申': '午未', '甲午': '辰巳', '甲辰': '寅卯', '甲寅': '子丑' };

// ===== 主函數 =====
export function calculateQimen(year, month, day, hour, minute, options = {}) {
    const { chartType = '時家置閏', gender = '男' } = options;

    const siZhu = getSiZhu(year, month, day, hour, minute);
    if (!siZhu) return null;

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const jqInfoOrig = getJieQiInfo(solar);

    let juNum, isYin, yuanName, jieqiName;
    let targetGan, targetZhi, doorTargetZhi;
    let isDayQimen = false;

    if (chartType === '年家奇門') {
        const info = getYearQimenInfo(year);
        juNum = info.juNum; isYin = info.isYin; yuanName = info.yuanName; jieqiName = jqInfoOrig.jieqiName;
        targetGan = siZhu.yearGan; targetZhi = siZhu.yearZhi; doorTargetZhi = siZhu.yearZhi;
    } else if (chartType === '月家奇門') {
        const info = getMonthQimenInfo(siZhu);
        juNum = info.juNum; isYin = info.isYin; yuanName = info.yuanName; jieqiName = jqInfoOrig.jieqiName;
        targetGan = siZhu.monthGan; targetZhi = siZhu.monthZhi; doorTargetZhi = siZhu.monthZhi;
    } else if (chartType === '日家奇門') {
        isDayQimen = true;
        juNum = 0; yuanName = ''; jieqiName = jqInfoOrig.jieqiName;
        targetGan = siZhu.dayGan; targetZhi = siZhu.dayZhi; doorTargetZhi = siZhu.dayZhi;
    } else if (chartType === '陰盤奇門') {
        const yinJu = getYinPanJu(solar, siZhu);
        juNum = yinJu.juNum; isYin = yinJu.isYin; yuanName = yinJu.yuanName; jieqiName = jqInfoOrig.jieqiName;
        targetGan = siZhu.hourGan; targetZhi = siZhu.hourZhi; doorTargetZhi = siZhu.hourZhi;
    } else { // 時家置閏, 命盤
        juNum = jqInfoOrig.juNum; isYin = jqInfoOrig.isYin;
        yuanName = ['上元', '中元', '下元'][jqInfoOrig.yuan]; jieqiName = jqInfoOrig.jieqiName;
        targetGan = siZhu.hourGan; targetZhi = siZhu.hourZhi; doorTargetZhi = siZhu.hourZhi;
    }

    let diPan = {}, xunInfo = {}, starPan = {}, tianPan = {}, doorPan = {}, shenPan = {};
    let dayQimenXun = '';

    if (isDayQimen) {
        const riRes = getRiJiaQimenPalaces(year, month, day, siZhu);
        doorPan = riRes.doorPan;
        starPan = riRes.starPan;
        isYin = riRes.isYin;
        dayQimenXun = riRes.xunName;
        xunInfo = getXunInfo(targetGan, targetZhi, { 1: '戊' });
    } else {
        diPan = buildDiPan(juNum, isYin);
        xunInfo = getXunInfo(targetGan, targetZhi, diPan);
        const starRes = buildStarAndTianPan(diPan, xunInfo, targetGan);
        starPan = starRes.starPan;
        tianPan = starRes.tianPan;

        const doorZhiToUse = doorTargetZhi || xunInfo.xunHeadZhi;
        const doorRes = buildDoorPan(diPan, xunInfo, doorZhiToUse, isYin);
        doorPan = doorRes.doorPan;
    }

    const shenRes = buildShenPan(starPan, xunInfo.zhiFuXing, isYin);
    shenPan = shenRes.shenPan;

    let fuYinFanYinStr = '';
    if (!isDayQimen) {
        if (starPan[1] === '天蓬') fuYinFanYinStr += '星伏';
        if (starPan[1] === '天英') fuYinFanYinStr += '星反';
        if (doorPan[1] === '休門') fuYinFanYinStr += '門伏';
        if (doorPan[1] === '景門') fuYinFanYinStr += '門反';
    }

    const palaces = PALACE_LAYOUT.map(p => {
        const diG = diPan[p.num] || '';
        const tianG = tianPan[p.num] || '';
        const diGExtra = p.num === 2 ? (diPan[5] || '') : '';
        const tianGExtra = starPan[p.num] === '天芮' ? (diPan[5] || '') : '';
        const dr = doorPan[p.num] || '';
        const harms = getHarmInfo(p.num, dr, tianG, diG, tianGExtra, diGExtra);

        let starToUse = starPan[p.num] || '';
        let tianGanToUse = tianG;

        return {
            ...p,
            diGan: isDayQimen ? '' : diG,
            diGanExtra: isDayQimen ? '' : diGExtra,
            tianGan: isDayQimen ? (p.num === 5 ? `${isYin ? '陰' : '陽'}${targetGan}${targetZhi}日` : '') : tianGanToUse,
            tianGanExtra: isDayQimen ? '' : tianGExtra,
            star: starToUse,
            door: dr,
            shen: isDayQimen ? '' : (shenPan[p.num] || ''),
            extraStar: '',
            extraGan: '',
            doorHarm: harms.doorHarm,
            tianGanHarm: harms.tianGanHarm,
            diGanHarm: harms.diGanHarm,
            tianGanExtraHarm: harms.tianGanExtraHarm,
            diGanExtraHarm: harms.diGanExtraHarm,
        };
    });

    const targetZhiStr = chartType === '年家奇門' ? siZhu.yearZhi : chartType === '月家奇門' ? siZhu.monthZhi : chartType === '日家奇門' ? siZhu.dayZhi : siZhu.hourZhi;
    const xunName = dayQimenXun || (xunInfo.xunNo !== undefined ? XUN_NAMES[xunInfo.xunNo] : '');
    const baseResult = {
        solar: { year, month, day, hour, minute, weekDay: siZhu.weekDay },
        lunar: { year: siZhu.lunarYear, month: siZhu.lunarMonth, day: siZhu.lunarDay, isLeap: siZhu.isLeapMonth },
        siZhu,
        jieqiName: jieqiName,
        yuanName: yuanName,
        juNum: juNum,
        isYin: isYin,
        yinYang: isYin ? '陰' : '陽',
        xunShou: xunName ? xunName + '旬' : '',
        kongWang: XUN_KONG[xunName] || '',
        yiMa: YI_MA_MAP[targetZhiStr] || '',
        fuTou: xunInfo.xunHeadZhi || '',
        zhiFuXing: xunInfo.zhiFuXing || '',
        zhiShiMen: xunInfo.zhiShiMen || '',
        fuYinFanYin: fuYinFanYinStr,
        chartType,
        isDayQimen,
        palaces,
    };

    if (chartType === '命盤') {
        const PERSONNEL_PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];
        const BRANCH_POSS = [
            { b: '子', p: 1, pos: 'bottom' }, { b: '丑', p: 8, pos: 'bottom' }, { b: '寅', p: 8, pos: 'left' },
            { b: '卯', p: 3, pos: 'left' }, { b: '辰', p: 4, pos: 'left' }, { b: '巳', p: 4, pos: 'top' },
            { b: '午', p: 9, pos: 'top' }, { b: '未', p: 2, pos: 'top' }, { b: '申', p: 2, pos: 'right' },
            { b: '酉', p: 7, pos: 'right' }, { b: '戌', p: 6, pos: 'right' }, { b: '亥', p: 6, pos: 'bottom' },
        ];

        // 排十二人事宮
        const birthZhiIndex = DI_ZHI.indexOf(siZhu.hourZhi);
        const palaces12 = {};
        for (let i = 0; i < 12; i++) {
            // 逆時針排佈十二人事宮
            const bIdx = (birthZhiIndex - i + 12) % 12;
            const branchInfo = BRANCH_POSS[bIdx];
            if (!palaces12[branchInfo.p]) palaces12[branchInfo.p] = [];
            palaces12[branchInfo.p].push({
                name: PERSONNEL_PALACES[i],
                branch: branchInfo.b,
                pos: branchInfo.pos
            });
        }

        // 排大限
        const isForward = (gender === '男' && !isYin) || (gender === '女' && isYin);
        const daXian = {};
        let currentPalace = juNum;
        let startAge = 1;
        let endAge = juNum; // 第一大限上限為局數

        for (let i = 0; i < 9; i++) {
            daXian[currentPalace] = { start: startAge, end: endAge };
            startAge = endAge;
            endAge = startAge + 10;

            if (isForward) {
                currentPalace = (currentPalace % 9) + 1;
            } else {
                currentPalace = currentPalace - 1;
                if (currentPalace === 0) currentPalace = 9;
            }
        }

        // 綁定到宮位
        baseResult.palaces = baseResult.palaces.map(p => ({
            ...p,
            personnel12: palaces12[p.num] || [],
            daXian: daXian[p.num]
        }));
        baseResult.chartType = '命盤';
        baseResult.gender = gender;
    }

    return baseResult;
}
