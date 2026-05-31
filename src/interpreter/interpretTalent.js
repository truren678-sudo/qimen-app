import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByDerived,
    getPalaceByPersonnel,
} from './palaceUtils.js';

const TALENT_SIGNAL = {
    '天輔': '學習、整理、教學、設計與規劃',
    '天心': '判斷、管理、專業分析與修復能力',
    '天任': '承擔、長期責任、教育與穩定服務',
    '天沖': '行動、競爭、突破與啟動能力',
    '天英': '表達、審美、曝光、內容與影響力',
    '天柱': '制度、口才、規範、法務或中介能力',
    '天蓬': '流動、冒險、商業敏感與資源嗅覺',
    '天芮': '問題處理、照顧、修復與承接壓力',
    '天禽': '整合、調度、中心協調與承載能力',
};

function describeTalentPalace(label, palace) {
    if (!palace) return `${label}資料不足，暫時無法判斷。`;
    const star = palace.symbols.star;
    const signal = TALENT_SIGNAL[star] || '需要結合其他符號判斷';
    return `${label}落在${formatPalaceLabel(palace)}，九星為${star || '無'}，偏向${signal}。此宮狀態：${formatStrength(palace)}，四害：${formatHarms(palace)}。`;
}

function buildPlatformAdvice(platformPalace) {
    if (!platformPalace) {
        return '平台宮資料不足，才華落地方式需要後續補判。';
    }
    if (['大旺宮', '旺宮'].includes(platformPalace.strength.level)) {
        return `平台宮在${formatPalaceLabel(platformPalace)}，代表才華較容易找到舞台。建議把能力放到可被看見、可被使用的環境裡，不要只停留在興趣層。`;
    }
    return `平台宮在${formatPalaceLabel(platformPalace)}，目前有${formatHarms(platformPalace)}。這代表不是沒有才華，而是舞台感需要自己建立，不能只等別人看見。`;
}

function buildCorePattern(mingPalace, shenPalace, fuDePalace, parentPalace, platformPalace) {
    const strong = [mingPalace, shenPalace, fuDePalace, parentPalace, platformPalace]
        .filter(Boolean)
        .filter(p => ['大旺宮', '旺宮'].includes(p.strength.level));
    const harmed = [mingPalace, shenPalace, fuDePalace, parentPalace, platformPalace]
        .filter(Boolean)
        .filter(p => p.harms.length > 0);

    if (strong.length >= 3 && harmed.length <= 1) {
        return '天賦線索比較集中，適合把興趣、學習與職涯逐步整合。';
    }
    if (harmed.length >= 3) {
        return '天賦不是沒有，而是容易被壓力、環境或自我懷疑卡住，需要先建立穩定節奏。';
    }
    return '天賦呈現多線並行，需要透過實際嘗試找出最能落地的方向。';
}

export function interpretTalent(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretTalent requires MingPan facts v0.1.');
    }

    const mingPalace = getPalaceByPersonnel(facts, '命宮');
    const shenPalace = getPalaceByDerived(facts, 'shenGong');
    const fuDePalace = getPalaceByPersonnel(facts, '福德');
    const parentPalace = getPalaceByPersonnel(facts, '父母');
    const platformPalace = getPalaceByDerived(facts, 'platformGong');
    const pattern = buildCorePattern(mingPalace, shenPalace, fuDePalace, parentPalace, platformPalace);

    const text = [
        `個性天賦要合看命宮、身宮、福德宮、父母宮與平台宮。整體來看，${pattern}`,
        describeTalentPalace('命宮代表先天個性', mingPalace),
        describeTalentPalace('身宮代表後天追求方向', shenPalace),
        describeTalentPalace('福德宮代表興趣、天賦與領悟力', fuDePalace),
        describeTalentPalace('父母宮代表學習力與吸收能力', parentPalace),
        buildPlatformAdvice(platformPalace),
    ].join('\n\n');

    return {
        schemaVersion: 'mingpan-talent-v0.1',
        topic: 'talent',
        text,
        cards: {
            pattern,
            mingPalace,
            shenPalace,
            fuDePalace,
            parentPalace,
            platformPalace,
        },
        evidence: {
            sourceModules: ['v7.3-W', 'v7.3-D', 'v7.3-EFGH'],
        },
    };
}

