import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByNum,
    getPalaceByPersonnel,
    getPalacesByStem,
    getRelationFromSelfPalace,
} from './palaceUtils.js';

const STEM_PAIR = {
    '甲': '己',
    '己': '甲',
    '乙': '庚',
    '庚': '乙',
    '丙': '辛',
    '辛': '丙',
    '丁': '壬',
    '壬': '丁',
    '戊': '癸',
    '癸': '戊',
};

const ROMANCE_STEMS = ['乙', '丙', '丁'];

function findSpouseSignal(facts) {
    const dayGan = facts.profile.siZhu.dayGan;
    const spouseStem = STEM_PAIR[dayGan] || '';
    const palaces = getPalacesByStem(facts, spouseStem);
    return {
        dayGan,
        spouseStem,
        palaces,
    };
}

function findRomanceSignals(facts) {
    return ROMANCE_STEMS.map(stem => ({
        stem,
        palaces: getPalacesByStem(facts, stem),
    })).filter(item => item.palaces.length > 0);
}

function describeSpouseSignal(signal, spousePalace) {
    if (!signal.spouseStem) {
        return '目前無法從日干合干判定配偶符號，感情解讀先以夫妻宮與當前大限為主。';
    }

    if (signal.palaces.length === 0) {
        return `你的日干為${signal.dayGan}，配偶符號為${signal.spouseStem}，但目前盤面中配偶符號不明顯。這通常代表感情需要靠後天選擇與環境引動，不適合只等緣分自己發生。`;
    }

    const labels = signal.palaces.map(formatPalaceLabel).join('、');
    const inSpousePalace = signal.palaces.some(p => p.num === spousePalace.num);
    if (inSpousePalace) {
        return `你的配偶符號${signal.spouseStem}落在夫妻宮相關位置，代表感情/婚姻議題有直接承接點。若夫妻宮狀態穩，感情較容易落實；若有四害，則需要先處理阻力與期待落差。`;
    }

    return `你的配偶符號${signal.spouseStem}出現在${labels}，代表感情緣分可能透過這些生活領域被引動，不只限於傳統的婚戀場景。`;
}

function describeRomanceSignals(signals) {
    if (signals.length === 0) {
        return '三奇桃花訊號不算明顯，感情重點會更偏向穩定關係與長期互動，而不是短期吸引。';
    }

    const text = signals.map(item => {
        const labels = item.palaces.map(formatPalaceLabel).join('、');
        return `${item.stem}在${labels}`;
    }).join('；');
    return `三奇桃花訊號可見：${text}。這代表吸引力或戀愛機會存在，但仍要看夫妻宮與子女宮是否有四害，不能只看有桃花就下結論。`;
}

function buildDaXianRelationship(facts, spousePalace, childPalace) {
    const stage = facts.derived.currentDaXian;
    if (!stage) return '目前大限資料不足，暫時先看本命夫妻宮與桃花宮。';

    const daXianPalace = getPalaceByNum(facts, stage.num);
    const spouseRelation = getRelationFromSelfPalace(daXianPalace, spousePalace);
    const childRelation = getRelationFromSelfPalace(daXianPalace, childPalace);
    const range = stage.range ? `${stage.range.start}-${stage.range.end}歲` : '目前';

    return `${range}大限中，大限宮與夫妻宮是「${spouseRelation.relation}」，與子女/桃花宮是「${childRelation.relation}」。這表示這十年的感情不是單看有沒有對象，而要看你是否願意用正確方式處理親密關係、吸引力與界線。`;
}

function buildAdvice(spousePalace, childPalace) {
    const warnings = [];
    if (spousePalace.harms.length > 0) warnings.push(`夫妻宮見${formatHarms(spousePalace)}，關係容易在落實、溝通或承諾上出現阻力。`);
    if (childPalace.harms.length > 0) warnings.push(`子女/桃花宮見${formatHarms(childPalace)}，短期吸引或親密互動需要更注意界線。`);

    if (warnings.length === 0) {
        return '感情建議是：以穩定互動、清楚承諾和真實溝通為主，不需要用太急的方式推進關係。';
    }

    return `${warnings.join('')}建議先把界線、承諾與溝通節奏講清楚。這不是說感情不好，而是越想走長期，越需要把容易誤會的地方先處理掉。`;
}

export function interpretRelationship(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretRelationship requires MingPan facts v0.1.');
    }

    const mingPalace = getPalaceByPersonnel(facts, '命宮');
    const spousePalace = getPalaceByPersonnel(facts, '夫妻');
    const wealthPalace = getPalaceByPersonnel(facts, '財帛');
    const childPalace = getPalaceByPersonnel(facts, '子女');
    const spouseSignal = findSpouseSignal(facts);
    const romanceSignals = findRomanceSignals(facts);
    const daXianText = buildDaXianRelationship(facts, spousePalace, childPalace);
    const advice = buildAdvice(spousePalace, childPalace);

    const text = [
        `感情要先看命宮、夫妻宮、財帛宮與子女宮。你的夫妻宮是${formatPalaceLabel(spousePalace)}，狀態為${formatStrength(spousePalace)}；財帛宮是夫妻宮的對待位，可用來看互動品質。`,
        describeSpouseSignal(spouseSignal, spousePalace),
        describeRomanceSignals(romanceSignals),
        daXianText,
        advice,
    ].join('\n\n');

    return {
        schemaVersion: 'mingpan-relationship-v0.1',
        topic: 'relationship',
        text,
        cards: {
            mingPalace,
            spousePalace,
            wealthPalace,
            childPalace,
            spouseSignal,
            romanceSignals,
            advice,
        },
        evidence: {
            sourceModules: ['v7.3-U', 'v7.3-M', 'v7.3-R'],
            spouseHarm: spousePalace.harms,
            childHarm: childPalace.harms,
        },
    };
}
