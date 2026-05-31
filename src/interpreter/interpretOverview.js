import { formatPalaceLabel, formatStrength, getPrimaryTopic } from './palaceUtils.js';

function getPalaceByNum(facts, num) {
    return facts.palaces.find(p => p.num === num) || null;
}

function summarizeChartPattern(facts) {
    const { fuYinFanYin, kongWangPalaces } = facts.chart;
    const topCount = facts.derived.luckRanking.top3.filter(item => item.score >= 60).length;
    const bottomCount = facts.derived.luckRanking.bottom3.filter(item => item.score <= 20).length;

    if (fuYinFanYin?.includes('伏')) {
        return '偏向長線累積、慢慢打底';
    }
    if (fuYinFanYin?.includes('反')) {
        return '帶有變動感，需要在起伏中調整節奏';
    }
    if ((kongWangPalaces || []).length >= 3) {
        return '有些領域容易出現落差感，需要先校準期待';
    }
    if (topCount >= 2 && bottomCount >= 2) {
        return '強弱分明，適合把力氣放在真正有回報的位置';
    }
    if (topCount >= 3) {
        return '可用資源不少，適合主動建立自己的節奏';
    }
    return '穩中帶選擇，重點在於看懂不同領域的投入順序';
}

function buildHighlight(item) {
    const topic = getPrimaryTopic(item);
    const strength = formatStrength(item);
    return {
        palace: item,
        title: topic,
        body: `${formatPalaceLabel(item)}的幸運指數較高，代表「${topic}」這個方向較容易累積成果。${strength}，適合被放進人生的主線規劃裡。`,
    };
}

function buildCaution(item) {
    const topic = getPrimaryTopic(item);
    const harmNames = item.harms.map(h => h.type);
    const harmText = harmNames.length > 0 ? `，並見${harmNames.join('、')}` : '';
    return {
        palace: item,
        title: topic,
        body: `${formatPalaceLabel(item)}需要多留意${harmText}。這不代表這個領域不好，而是「${topic}」比較不適合硬衝，建議先降低期待落差，採取更穩、更可控的做法。`,
    };
}

function buildCurrentStage(facts) {
    const stage = facts.derived.currentDaXian;
    if (!stage) {
        return {
            title: '目前人生階段',
            body: '目前大限資料尚不足以判定階段主題，建議先以命盤總體強弱和十二宮分布作為參考。',
            evidence: null,
        };
    }

    const palace = getPalaceByNum(facts, stage.num);
    const topic = getPrimaryTopic(palace);
    const strength = palace ? formatStrength(palace) : '需要穩定觀察';
    const range = stage.range ? `${stage.range.start}-${stage.range.end}歲` : '目前';

    return {
        title: `${range}大限`,
        body: `你目前走在${formatPalaceLabel(palace || stage)}的大限，這個階段的主題會更靠近「${topic}」。${strength}，所以這十年不只看運氣，更要看你是否把注意力放在對的位置。`,
        evidence: {
            palaceNum: stage.num,
            range: stage.range,
            strength: palace?.strength || null,
            harms: palace?.harms || [],
        },
    };
}

function buildOpening(facts, pattern) {
    const { yinYang, juNum } = facts.chart;
    const gender = facts.profile.gender ? `${facts.profile.gender}命` : '命盤';
    return `這是一張${yinYang}${juNum}局的九宮奇門${gender}。整體來看，你的命盤呈現「${pattern}」的結構。`;
}

function buildSummary({ opening, highlights, cautions, currentStage }) {
    const mixedTitles = cautions
        .filter(caution => highlights.some(highlight => highlight.palace.num === caution.palace.num))
        .map(item => item.title);
    const highlightText = highlights.length > 0
        ? `最值得先看的是${highlights.map(h => h.title).join('、')}，這些位置比較容易成為你人生中的可用資源。`
        : '目前沒有特別突出的高分宮位，重點會放在穩定經營與減少消耗。';
    const cautionText = cautions.length > 0
        ? `需要留意的是${cautions.map(c => c.title).join('、')}，它們不是不能碰，而是需要更有策略地處理。`
        : '目前低分或四害較重的提醒不算集中，整體可以用較平穩的方式觀察。';
    const mixedText = mixedTitles.length > 0
        ? `其中${mixedTitles.join('、')}同時有可用資源與風險提示，意思是這些領域並非不好，而是「越有機會，越需要方法」。`
        : '';

    return [opening, highlightText, cautionText, mixedText, currentStage.body].filter(Boolean).join('\n\n');
}

function selectHighlights(facts) {
    return facts.derived.luckRanking.top3
        .map(item => getPalaceByNum(facts, item.num))
        .filter(Boolean)
        .map(buildHighlight);
}

function selectCautions(facts) {
    const bottom = facts.derived.luckRanking.bottom3
        .map(item => getPalaceByNum(facts, item.num))
        .filter(Boolean);
    const harmed = facts.palaces
        .filter(p => p.num !== 5 && p.harms.length >= 2)
        .sort((a, b) => b.harms.length - a.harms.length || a.luck.score - b.luck.score);

    const selected = [];
    [...harmed, ...bottom].forEach(item => {
        if (selected.length < 3 && !selected.some(p => p.num === item.num)) {
            selected.push(item);
        }
    });

    return selected.map(buildCaution);
}

export function interpretOverview(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretOverview requires MingPan facts v0.1.');
    }

    const pattern = summarizeChartPattern(facts);
    const opening = buildOpening(facts, pattern);
    const highlights = selectHighlights(facts);
    const cautions = selectCautions(facts);
    const currentStage = buildCurrentStage(facts);
    const text = buildSummary({ opening, highlights, cautions, currentStage });

    return {
        schemaVersion: 'mingpan-overview-v0.1',
        tone: 'user-facing',
        policy: {
            avoidsAbsoluteClaims: true,
            includesActionableCautions: true,
            source: 'v7.3 facts + v1.0.1 translation principles',
        },
        headline: pattern,
        text,
        cards: {
            highlights,
            cautions,
            currentStage,
        },
        evidence: {
            chart: {
                yinYang: facts.chart.yinYang,
                juNum: facts.chart.juNum,
                fuYinFanYin: facts.chart.fuYinFanYin,
                kongWangPalaces: facts.chart.kongWangPalaces,
            },
            luckRanking: facts.derived.luckRanking,
        },
    };
}
