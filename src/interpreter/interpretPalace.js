import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByNum,
    getPalaceByPersonnel,
    getPrimaryTopic,
} from './palaceUtils.js';

const SHEN_MEANING = {
    '值符': '主導、信任、權威與正面承擔',
    '騰蛇': '想像、糾結、反覆與敏感度',
    '太陰': '細膩、幕後、規劃與隱性資源',
    '六合': '合作、關係、整合與連結',
    '白虎': '壓力、衝突、執行力與破局',
    '玄武': '隱情、資訊不透明、流動與風險',
    '九地': '穩定、沉澱、保守與長期累積',
    '九天': '格局、擴張、遠方與高處視野',
};

const STAR_MEANING = {
    '天蓬': '冒險、流動、慾望與不安分的能量',
    '天芮': '承受、照顧、問題處理與修復',
    '天沖': '行動、競爭、突破與衝勁',
    '天輔': '學習、文教、規劃與輔助能力',
    '天禽': '整合、中心、承載與調度',
    '天心': '判斷、管理、專業與醫療修復',
    '天柱': '制度、口才、壓力與規範',
    '天任': '責任、承擔、穩重與長期主義',
    '天英': '表達、曝光、美感與火熱能量',
};

const DOOR_MEANING = {
    '休門': '適合休養、協調、體制與穩定節奏',
    '生門': '代表生發、收入、資產與成長機會',
    '傷門': '代表競爭、行動、衝撞與修正',
    '杜門': '代表技術、封閉、保密與專業壁壘',
    '景門': '代表曝光、表達、審美與名聲',
    '死門': '代表停滯、結束、沉澱與重新整理',
    '驚門': '代表變動、壓力、口舌與突發狀況',
    '開門': '代表開創、事業、升遷與可打開的門路',
};

function resolvePalace(facts, target) {
    if (typeof target === 'number') return getPalaceByNum(facts, target);
    if (typeof target === 'string') return getPalaceByPersonnel(facts, target);
    if (target?.num) return getPalaceByNum(facts, target.num);
    if (target?.personnel) return getPalaceByPersonnel(facts, target.personnel);
    return null;
}

function buildSymbolLines(palace) {
    const { shen, star, door, tianGan, diGan } = palace.symbols;
    return [
        shen ? `八神「${shen}」偏向${SHEN_MEANING[shen] || '此宮的底層氣質'}。` : '',
        star ? `九星「${star}」偏向${STAR_MEANING[star] || '此宮的能量類型'}。` : '',
        door ? `八門「${door}」偏向${DOOR_MEANING[door] || '此宮的行動方式'}。` : '',
        `天盤干為${tianGan || '無'}，地盤干為${diGan || '無'}，可作為後續格局判讀依據。`,
    ].filter(Boolean);
}

function buildAdvice(palace) {
    const topic = getPrimaryTopic(palace);
    if (palace.harms.length === 0 && palace.luck.score >= 60) {
        return `這個宮位適合被主動經營。若它對應的是${topic}，可以把它當成你比較值得投入的方向。`;
    }
    if (palace.harms.length === 0) {
        return `這個宮位沒有明顯四害，適合穩定經營，不必急著求快。`;
    }
    return `這個宮位有${formatHarms(palace)}，建議先降低硬碰硬的做法。不是不能做，而是要先避開資訊不清、情緒衝動和過度消耗。`;
}

export function interpretPalace(facts, target) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretPalace requires MingPan facts v0.1.');
    }

    const palace = resolvePalace(facts, target);
    if (!palace) {
        throw new Error('Palace not found.');
    }

    const topic = getPrimaryTopic(palace);
    const symbolLines = buildSymbolLines(palace);
    const advice = buildAdvice(palace);
    const text = [
        `${formatPalaceLabel(palace)}主要對應「${topic}」。`,
        `此宮幸運指數為${palace.luck.score}分，旺衰評定為${palace.strength.level}，整體可理解為：${formatStrength(palace)}。`,
        symbolLines.join(''),
        `四害狀態：${formatHarms(palace)}。`,
        advice,
    ].join('\n\n');

    return {
        schemaVersion: 'mingpan-palace-v0.1',
        topic: 'single-palace',
        palace,
        text,
        cards: {
            topic,
            symbols: symbolLines,
            advice,
        },
        evidence: {
            sourceModules: ['v7.3-C', 'v7.3-D', 'v7.3-EFGH', 'v7.3-I', 'v7.3-K', 'v7.3-X2'],
            luck: palace.luck,
            strength: palace.strength,
            harms: palace.harms,
        },
    };
}

