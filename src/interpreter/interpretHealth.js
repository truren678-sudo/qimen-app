import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByPersonnel,
    getRelationFromSelfPalace,
} from './palaceUtils.js';

const BODY_AREA = {
    1: '腎臟、泌尿、生殖、耳朵與水液代謝相關區域',
    2: '腹部、消化、皮膚、肌肉與承受壓力的區域',
    3: '肝膽、神經、筋腱、足部與行動壓力相關區域',
    4: '腸道、氣息、循環流動與下肢相關區域',
    6: '骨骼、大腸、頭部右側與結構支撐相關區域',
    7: '肺、口腔、咽喉、呼吸與皮膚相關區域',
    8: '胃、脾、背部、手部與消化承載相關區域',
    9: '心臟、眼睛、血管、頭部與發熱發炎相關區域',
};

const HEALTH_SYMBOLS = new Set(['白虎', '騰蛇', '玄武', '天芮', '天柱', '天心', '天英', '傷門', '死門', '驚門', '杜門', '景門']);

function getHealthSignals(palace) {
    const values = [palace.symbols.shen, palace.symbols.star, palace.symbols.door].filter(Boolean);
    return values.filter(value => HEALTH_SYMBOLS.has(value));
}

function buildPalaceHealthLine(label, palace) {
    const signals = getHealthSignals(palace);
    const signalText = signals.length > 0 ? `，並見${signals.join('、')}等健康/壓力訊號` : '';
    return `${label}是${formatPalaceLabel(palace)}，狀態為${formatStrength(palace)}，四害為${formatHarms(palace)}${signalText}。可關注${BODY_AREA[palace.num] || '對應身心區域'}。`;
}

function buildRelationLine(mingPalace, illnessPalace, fuDePalace) {
    const illnessToMing = getRelationFromSelfPalace(mingPalace, illnessPalace);
    const fuDeToIllness = getRelationFromSelfPalace(illnessPalace, fuDePalace);
    return `命宮與疾厄宮的關係為「${illnessToMing.relation}」，疾厄宮與福德宮的關係為「${fuDeToIllness.relation}」。這裡重點不是診斷疾病，而是看身體壓力、精神狀態與生活節奏如何互相牽動。`;
}

function buildHealthAdvice(palaces) {
    const highRisk = palaces.filter(p => p.harms.length > 0 || getHealthSignals(p).length >= 2);
    if (highRisk.length === 0) {
        return '整體健康提醒偏向日常保養：穩定作息、規律運動、減少長期壓力累積。命理只提供節奏提醒，具體健康問題仍應以醫療專業為準。';
    }

    const topics = highRisk.map(p => formatPalaceLabel(p)).join('、');
    return `${topics}有較明顯的壓力提示。建議把它理解成生活節奏的提醒：避免過勞、定期檢查、及早處理小問題。若已有不適，請優先諮詢醫療專業。`;
}

export function interpretHealth(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretHealth requires MingPan facts v0.1.');
    }

    const mingPalace = getPalaceByPersonnel(facts, '命宮');
    const illnessPalace = getPalaceByPersonnel(facts, '疾厄');
    const fuDePalace = getPalaceByPersonnel(facts, '福德');
    const childPalace = getPalaceByPersonnel(facts, '子女');
    const palaces = [mingPalace, illnessPalace, fuDePalace, childPalace].filter(Boolean);
    const advice = buildHealthAdvice(palaces);

    const text = [
        '健康專題在 App 中只作為身心狀態與風險管理提醒，不作醫療診斷。',
        buildPalaceHealthLine('命宮代表整體健康底色', mingPalace),
        buildPalaceHealthLine('疾厄宮代表身體壓力與病灶源頭的提示', illnessPalace),
        buildPalaceHealthLine('福德宮代表精神狀態與長期滿足感', fuDePalace),
        buildPalaceHealthLine('子女宮也可作為意外與突發風險的提醒', childPalace),
        buildRelationLine(mingPalace, illnessPalace, fuDePalace),
        advice,
    ].join('\n\n');

    return {
        schemaVersion: 'mingpan-health-v0.1',
        topic: 'health-risk',
        text,
        cards: {
            mingPalace,
            illnessPalace,
            fuDePalace,
            childPalace,
            advice,
        },
        evidence: {
            sourceModules: ['v7.3-V', 'v7.3-M'],
            disclaimer: 'Not medical advice.',
        },
    };
}

