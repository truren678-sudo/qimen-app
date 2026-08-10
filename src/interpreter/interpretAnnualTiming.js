import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByNum,
    getRelationFromSelfPalace,
    summarizePalaceTopics,
} from './palaceUtils.js';

const OPPOSITE_PALACE = {
    1: 9,
    9: 1,
    2: 8,
    8: 2,
    3: 7,
    7: 3,
    4: 6,
    6: 4,
};

function getYearFromAge(facts, nominalAge) {
    return (facts.profile.civilBirthDate?.year || facts.profile.solar.year) + nominalAge - 1;
}

function buildTimingAdvice(yearPalace, oppositePalace, relationInfo) {
    if (yearPalace.harms.length === 0 && ['他來生我', '我去生他'].includes(relationInfo.relation)) {
        return '這一年比較適合把握機會，但仍要回到大限主題，不宜脫離長期方向亂衝。';
    }
    if (yearPalace.harms.length > 0) {
        return `這一年踩到的宮位見${formatHarms(yearPalace)}，適合保守處理該宮位對應的議題，先避開高風險行動。`;
    }
    if (oppositePalace?.harms?.length > 0) {
        return `本宮狀態尚可，但對宮${formatPalaceLabel(oppositePalace)}見${formatHarms(oppositePalace)}，容易把對宮議題翻出來。建議先檢查相關領域是否有舊問題未處理。`;
    }
    return '這一年沒有明顯高壓提示，可以用穩定推進的方式處理當年主題。';
}

export function interpretAnnualTiming(facts, options = {}) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretAnnualTiming requires MingPan facts v0.1.');
    }

    const nominalAge = options.nominalAge || facts.profile.nominalAge;
    const year = options.year || getYearFromAge(facts, nominalAge);
    const yearPalace = facts.palaces.find(p => p.liuNianAges.includes(nominalAge)) || facts.derived.currentYearPalace && getPalaceByNum(facts, facts.derived.currentYearPalace.num);
    const daXianRef = facts.derived.currentDaXian;
    const daXianPalace = daXianRef ? getPalaceByNum(facts, daXianRef.num) : null;

    if (!yearPalace || !daXianPalace) {
        return {
            schemaVersion: 'mingpan-annual-timing-v0.1',
            topic: 'annual-timing',
            text: '目前缺少流年宮位或大限宮位資料，暫時無法生成年度提示。',
            cards: null,
            evidence: { sourceModules: ['v7.3-S'] },
        };
    }

    const oppositePalace = OPPOSITE_PALACE[yearPalace.num] ? getPalaceByNum(facts, OPPOSITE_PALACE[yearPalace.num]) : null;
    const relationInfo = getRelationFromSelfPalace(daXianPalace, yearPalace);
    const advice = buildTimingAdvice(yearPalace, oppositePalace, relationInfo);
    const text = [
        `${year}年約為虛歲${nominalAge}歲，流年走到${formatPalaceLabel(yearPalace)}，主題偏向${summarizePalaceTopics([yearPalace])}。`,
        `以當前大限${formatPalaceLabel(daXianPalace)}為太極點，流年宮與大限宮的關係是「${relationInfo.relation}」。${relationInfo.description}。`,
        `流年宮狀態為${formatStrength(yearPalace)}，四害為${formatHarms(yearPalace)}。${oppositePalace ? `對宮是${formatPalaceLabel(oppositePalace)}，四害為${formatHarms(oppositePalace)}。` : ''}`,
        advice,
        '流年只用來看應期，不代表每一年都重新換一張命盤；真正的事件主軸仍要先回到當前大限。',
    ].join('\n\n');

    return {
        schemaVersion: 'mingpan-annual-timing-v0.1',
        topic: 'annual-timing',
        text,
        cards: {
            year,
            nominalAge,
            yearPalace,
            oppositePalace,
            daXianPalace,
            relationInfo,
            advice,
        },
        evidence: {
            sourceModules: ['v7.3-S', 'v7.3-R', 'v7.3-M'],
            rule: '大限斷事件，流年定應期',
        },
    };
}

