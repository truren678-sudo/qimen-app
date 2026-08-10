import { getCivilYear } from '../utils/civilDateTime.js';

const PALACE_ELEMENTS = {
    1: '水',
    2: '土',
    3: '木',
    4: '木',
    5: '土',
    6: '金',
    7: '金',
    8: '土',
    9: '火',
};

const PALACE_FULL_NAMES = {
    1: '坎',
    2: '坤',
    3: '震',
    4: '巽',
    5: '中',
    6: '乾',
    7: '兌',
    8: '艮',
    9: '離',
};

const DZ_PALACE = {
    '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4,
    '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6,
};

const PERSONNEL_KIND = {
    '命宮': 'person',
    '兄弟': 'person',
    '夫妻': 'person',
    '子女': 'person',
    '交友': 'person',
    '父母': 'person',
    '財帛': 'event',
    '疾厄': 'event',
    '遷移': 'event',
    '事業': 'event',
    '田宅': 'event',
    '福德': 'event',
};

const LUCKY_SHEN = new Set(['值符', '太陰', '六合', '九天']);
const LUCKY_STAR = new Set(['天輔', '天心', '天任']);
const LUCKY_DOOR = new Set(['開門', '休門', '生門']);
const LUCKY_GAN = new Set(['乙', '丙', '丁', '戊']);
const XUN_HIDDEN_GAN = {
    '甲子': '戊',
    '甲戌': '己',
    '甲申': '庚',
    '甲午': '辛',
    '甲辰': '壬',
    '甲寅': '癸',
};

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function includesGan(value, gan) {
    return Boolean(value && gan && Array.from(value).includes(gan));
}

function getKongWangPalaces(kongWang) {
    if (!kongWang) return [];
    return unique(Array.from(kongWang).map(zhi => DZ_PALACE[zhi]));
}

function getHarmEntries(palace, isKong) {
    const entries = [];
    if (palace.doorHarm) entries.push({ type: palace.doorHarm === '迫' ? '門迫' : palace.doorHarm, source: 'door' });
    if (palace.tianGanHarm) entries.push({ type: palace.tianGanHarm, source: 'tianGan' });
    if (palace.tianGanExtraHarm) entries.push({ type: palace.tianGanExtraHarm, source: 'tianGanExtra' });
    if (palace.diGanHarm) entries.push({ type: palace.diGanHarm, source: 'diGan' });
    if (palace.diGanExtraHarm) entries.push({ type: palace.diGanExtraHarm, source: 'diGanExtra' });
    if (isKong) entries.push({ type: '空亡', source: 'kongWang' });
    return entries;
}

function calculateLuckScore(palace) {
    let score = 0;
    const details = [];

    if (LUCKY_SHEN.has(palace.shen)) {
        score += 20;
        details.push({ symbol: palace.shen, category: '八神', points: 20 });
    }
    if (LUCKY_STAR.has(palace.star)) {
        score += 20;
        details.push({ symbol: palace.star, category: '九星', points: 20 });
    }
    if (LUCKY_DOOR.has(palace.door)) {
        score += 40;
        details.push({ symbol: palace.door, category: '八門', points: 40 });
    }
    if (LUCKY_GAN.has(palace.tianGan)) {
        score += 10;
        details.push({ symbol: palace.tianGan, category: '天盤干', points: 10 });
    }
    if (LUCKY_GAN.has(palace.diGan)) {
        score += 10;
        details.push({ symbol: palace.diGan, category: '地盤干', points: 10 });
    }

    return {
        score,
        details,
        method: 'v7.3-x2',
    };
}

function assessStrength(harms, luckScore) {
    const severeCount = harms.filter(h => ['擊刑', '刑', '刑墓', '門迫', '空亡'].includes(h.type)).length;
    const tombCount = harms.filter(h => ['入墓', '墓', '刑墓'].includes(h.type)).length;
    const total = harms.length;

    if (total === 0 && luckScore >= 60) return { level: '大旺宮', method: 'v7.3-k-heuristic' };
    if (total === 0) return { level: '旺宮', method: 'v7.3-k-heuristic' };
    if (total === 1 && severeCount === 0) return { level: '小衰宮', method: 'v7.3-k-heuristic' };
    if (total <= 2 && severeCount <= 1 && tombCount > 0) return { level: '小衰宮', method: 'v7.3-k-heuristic' };
    if (total >= 3 && severeCount >= 2) return { level: '大衰宮', method: 'v7.3-k-heuristic' };
    return { level: '衰宮', method: 'v7.3-k-heuristic' };
}

function findPalaceByPersonnel(palaces, personnelName) {
    return palaces.find(p => p.personnel12?.some(item => item.name === personnelName)) || null;
}

function findPalaceByGan(palaces, gan) {
    return palaces.find(p => includesGan(p.symbols?.tianGan, gan) || includesGan(p.symbols?.tianGanExtra, gan)) || null;
}

function getEffectiveHourStem(result) {
    if (result.siZhu?.hourGan !== '甲') return result.siZhu?.hourGan || '';
    const xunName = result.xunShou?.replace('旬', '');
    return XUN_HIDDEN_GAN[xunName] || '甲';
}

function getNominalAge(result, asOfDate, birthDate) {
    const currentYear = getCivilYear(asOfDate);
    return currentYear - (birthDate?.year || result.solar.year) + 1;
}

function buildPalaceFact(result, palace, kongWangPalaces, maPalace) {
    const isKong = kongWangPalaces.includes(palace.num);
    const isMa = maPalace === palace.num;
    const harms = getHarmEntries(palace, isKong);
    const luck = calculateLuckScore(palace);
    const strength = assessStrength(harms, luck.score);

    return {
        num: palace.num,
        name: palace.name,
        fullName: PALACE_FULL_NAMES[palace.num] || palace.name,
        element: PALACE_ELEMENTS[palace.num] || '',
        symbol: palace.sym || '',
        personnel12: (palace.personnel12 || []).map(item => ({
            name: item.name,
            branch: item.branch,
            position: item.pos,
            kind: PERSONNEL_KIND[item.name] || 'unknown',
        })),
        daXian: palace.daXian || null,
        liuNianAges: palace.liuNianAges || [],
        symbols: {
            shen: palace.shen || '',
            star: palace.star || '',
            door: palace.door || '',
            tianGan: palace.tianGan || '',
            tianGanExtra: palace.tianGanExtra || '',
            diGan: palace.diGan || '',
            diGanExtra: palace.diGanExtra || '',
            yinGan: palace.yinGan || '',
            extraStar: palace.extraStar || '',
        },
        harms,
        isKong,
        isMa,
        luck,
        strength,
    };
}

export function buildMingPanFacts(result, options = {}) {
    if (!result || result.chartType !== '命盤') {
        throw new Error('buildMingPanFacts requires a 命盤 result.');
    }

    const kongWangPalaces = getKongWangPalaces(result.kongWang);
    const maPalace = DZ_PALACE[result.yiMa] || null;
    const palaceFacts = result.palaces.map(palace => buildPalaceFact(result, palace, kongWangPalaces, maPalace));
    const nominalAge = getNominalAge(result, options.asOfDate, options.birthDate);
    const effectiveHourStem = getEffectiveHourStem(result);

    const mingGong = findPalaceByPersonnel(palaceFacts, '命宮');
    const shenGong = findPalaceByGan(palaceFacts, result.siZhu.dayGan);
    const platformGong = findPalaceByGan(palaceFacts, effectiveHourStem);
    const careerPalace = findPalaceByPersonnel(palaceFacts, '事業');
    const wealthPalace = findPalaceByPersonnel(palaceFacts, '財帛');
    const spousePalace = findPalaceByPersonnel(palaceFacts, '夫妻');
    const currentDaXian = palaceFacts.find(p => p.daXian && nominalAge >= p.daXian.start && nominalAge <= p.daXian.end) || null;
    const currentYearPalace = palaceFacts.find(p => p.liuNianAges.includes(nominalAge)) || null;

    const rankedByLuck = palaceFacts
        .filter(p => p.num !== 5)
        .map(p => ({ num: p.num, name: p.fullName, personnel12: p.personnel12, score: p.luck.score, strength: p.strength.level }))
        .sort((a, b) => b.score - a.score);

    return {
        schemaVersion: 'mingpan-facts-v0.1',
        profile: {
            gender: result.gender || '',
            solar: result.solar,
            civilBirthDate: options.birthDate || result.solar,
            lunar: result.lunar,
            siZhu: result.siZhu,
            nominalAge,
            asOfDate: options.asOfDate || null,
        },
        chart: {
            chartType: result.chartType,
            jieqiName: result.jieqiName,
            yuanName: result.yuanName,
            yinYang: result.yinYang,
            juNum: result.juNum,
            xunShou: result.xunShou,
            kongWang: result.kongWang,
            kongWangPalaces,
            yiMa: result.yiMa,
            maPalace,
            fuTou: result.fuTou,
            zhiFuXing: result.zhiFuXing,
            zhiShiMen: result.zhiShiMen,
            fuYinFanYin: result.fuYinFanYin,
        },
        palaces: palaceFacts,
        derived: {
            mingGong: mingGong ? { num: mingGong.num, name: mingGong.fullName } : null,
            shenGong: shenGong ? { num: shenGong.num, name: shenGong.fullName, stem: result.siZhu.dayGan } : null,
            platformGong: platformGong ? { num: platformGong.num, name: platformGong.fullName, stem: effectiveHourStem } : null,
            careerPalace: careerPalace ? { num: careerPalace.num, name: careerPalace.fullName } : null,
            wealthPalace: wealthPalace ? { num: wealthPalace.num, name: wealthPalace.fullName } : null,
            spousePalace: spousePalace ? { num: spousePalace.num, name: spousePalace.fullName } : null,
            currentDaXian: currentDaXian ? {
                num: currentDaXian.num,
                name: currentDaXian.fullName,
                range: currentDaXian.daXian,
            } : null,
            currentYearPalace: currentYearPalace ? {
                num: currentYearPalace.num,
                name: currentYearPalace.fullName,
                nominalAge,
            } : null,
            luckRanking: {
                top3: rankedByLuck.slice(0, 3),
                bottom3: [...rankedByLuck].reverse().slice(0, 3),
            },
        },
    };
}
