import {
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getEffectivePalaceScore,
    getPalaceByNum,
    getPalaceByPersonnel,
    getRelationFromSelfPalace,
} from './palaceUtils.js';

function classifyCareerWealth(careerPalace, wealthPalace) {
    const careerScore = getEffectivePalaceScore(careerPalace);
    const wealthScore = getEffectivePalaceScore(wealthPalace);
    const diff = wealthScore - careerScore;

    if (diff >= 15) {
        return {
            type: '財格',
            careerScore,
            wealthScore,
            summary: '財帛宮強於事業宮，較偏向「直接面對市場、靠資源與財務敏感度創造成果」的類型。',
            userCopy: '你比較像是「先看到資金與機會，再決定怎麼做事」的人。自由度高、能自己掌握節奏的工作，通常比太制式的環境更能讓你發揮。',
        };
    }

    if (diff <= -15) {
        return {
            type: '官格',
            careerScore,
            wealthScore,
            summary: '事業宮強於財帛宮，較偏向「靠舞台、地位、專業累積帶動財富」的類型。',
            userCopy: '你比較像是「先有舞台，再有票房」的人。與其急著直接求財，更適合在一個領域累積專業、位置與話語權，財富會跟著事業成果一起長出來。',
        };
    }

    return {
        type: '命財官平衡型',
        careerScore,
        wealthScore,
        summary: '事業宮與財帛宮強弱接近，適合同時看事業舞台與財務成果，不宜只押單一路徑。',
        userCopy: '你的命盤不是單純「只求財」或「只求職位」的型，而是需要讓事業方向和收入模式彼此配合。工作做對了，錢才容易穩；錢的模式設計對了，事業也會更有動力。',
    };
}

function getCareerShape(careerPalace) {
    const { star, door, shen } = careerPalace.symbols;
    const signals = [];

    if (['天輔'].includes(star)) signals.push('文教、設計、規劃、顧問型能力');
    if (['天心'].includes(star)) signals.push('專業判斷、管理、醫療或決策型能力');
    if (['天任'].includes(star)) signals.push('承擔、照顧、教育與長期負責');
    if (['天沖'].includes(star)) signals.push('競爭、開創、需要行動力的環境');
    if (['天英'].includes(star)) signals.push('表達、媒體、公關、審美與曝光');
    if (['天柱'].includes(star)) signals.push('制度、法務、紀律、聲音表達或中介角色');

    if (door === '開門') signals.push('適合開創、升遷、經營或走向更大的舞台');
    if (door === '休門') signals.push('適合體制、穩定機構、公部門或需要秩序的環境');
    if (door === '生門') signals.push('適合生意、買賣、資產、土地或自己找財路');
    if (door === '杜門') signals.push('適合技術、保密、專業壁壘或深度研究');

    if (shen === '六合') signals.push('合作、合夥、人際整合是重要工作模式');
    if (shen === '九天') signals.push('適合拉高格局，做更大範圍的規劃與開拓');
    if (shen === '太陰') signals.push('適合幕後規劃、細膩服務、研究與策略安排');
    if (shen === '值符') signals.push('適合承擔主導位置，建立權威與信任');

    return signals;
}

function buildCurrentDaXianCareerAdvice(facts, careerPalace, wealthPalace) {
    const stage = facts.derived.currentDaXian;
    if (!stage) {
        return {
            title: '當前十年事業財富節奏',
            body: '目前大限資料不足，暫時先以命宮、事業宮、財帛宮三方作為主要參考。',
            relations: {},
        };
    }

    const daXianPalace = getPalaceByNum(facts, stage.num);
    const careerRelation = getRelationFromSelfPalace(daXianPalace, careerPalace);
    const wealthRelation = getRelationFromSelfPalace(daXianPalace, wealthPalace);

    const relationAdvice = [];
    if (careerRelation.relation === '我去剋他') {
        relationAdvice.push('這十年的事業比較像「你要主動推動才會有結果」，適合設定清楚目標，持續往前壓。');
    } else if (careerRelation.relation === '他來生我') {
        relationAdvice.push('這十年事業上較容易得到外部支持，適合主動接觸貴人、平台與合作機會。');
    } else if (careerRelation.relation === '他來剋我') {
        relationAdvice.push('這十年事業外部壓力較強，不適合硬碰硬，先找保護傘或穩定平台會更好。');
    } else if (careerRelation.relation === '我去生他') {
        relationAdvice.push('這十年你會願意為事業投入很多，但要注意不要只燃燒自己，要建立可持續的節奏。');
    }

    if (wealthRelation.relation === '他來剋我') {
        relationAdvice.push('財務上要特別注意壓力與責任，不適合輕易借貸、擔保或承擔別人的財務問題。');
    } else if (wealthRelation.relation === '我去生他' && wealthPalace.harms.length > 0) {
        relationAdvice.push('你會想主動求財，但財帛宮有風險提示，越急著投入越容易消耗，建議用事業帶動財富。');
    } else if (wealthRelation.relation === '他來生我') {
        relationAdvice.push('財務機會較容易靠外部資源而來，重點是篩選可信任的人與長期穩定的模式。');
    }

    return {
        title: `${stage.range?.start || ''}-${stage.range?.end || ''}歲事業財富節奏`,
        body: relationAdvice.join('') || `這十年的事業與財務節奏屬於${careerRelation.relation}、${wealthRelation.relation}的組合，建議以穩定累積和風險控管為優先。`,
        relations: {
            daXianPalace: daXianPalace ? { num: daXianPalace.num, name: daXianPalace.fullName, element: daXianPalace.element } : null,
            career: careerRelation,
            wealth: wealthRelation,
        },
    };
}

function buildRiskAdvice(careerPalace, wealthPalace) {
    const risks = [];

    if (careerPalace.harms.length > 0) {
        risks.push(`事業宮見${formatHarms(careerPalace)}，代表職涯不是不能做，而是需要避開硬衝、急轉與缺乏支援的做法。`);
    }
    if (wealthPalace.harms.length > 0) {
        risks.push(`財帛宮見${formatHarms(wealthPalace)}，直接求財時要更謹慎，尤其要避開快速賺錢、借貸擔保與資訊不透明的合作。`);
    }
    if (risks.length === 0) {
        risks.push('事業宮與財帛宮沒有明顯四害集中，適合把重點放在長期累積與選對賽道。');
    }

    return risks;
}

function buildText({ classification, careerPalace, wealthPalace, mingPalace, careerShape, daXianAdvice, riskAdvice }) {
    const shapeText = careerShape.length > 0
        ? `事業符號給出的訊號包括：${careerShape.join('、')}。`
        : '事業符號目前沒有特別單一的方向，適合回到命宮、事業宮、財帛宮三方一起判斷。';

    return [
        `從命財官三方來看，你目前比較偏「${classification.type}」。${classification.userCopy}`,
        `命宮是${formatPalaceLabel(mingPalace)}，事業宮是${formatPalaceLabel(careerPalace)}，財帛宮是${formatPalaceLabel(wealthPalace)}。事業宮狀態：${formatStrength(careerPalace)}；財帛宮狀態：${formatStrength(wealthPalace)}。`,
        shapeText,
        daXianAdvice.body,
        riskAdvice.join(''),
    ].join('\n\n');
}

export function interpretCareerWealth(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretCareerWealth requires MingPan facts v0.1.');
    }

    const mingPalace = getPalaceByPersonnel(facts, '命宮');
    const careerPalace = getPalaceByPersonnel(facts, '事業');
    const wealthPalace = getPalaceByPersonnel(facts, '財帛');

    if (!mingPalace || !careerPalace || !wealthPalace) {
        throw new Error('Career wealth interpretation requires 命宮, 事業宮, and 財帛宮.');
    }

    const classification = classifyCareerWealth(careerPalace, wealthPalace);
    const careerShape = getCareerShape(careerPalace);
    const daXianAdvice = buildCurrentDaXianCareerAdvice(facts, careerPalace, wealthPalace);
    const riskAdvice = buildRiskAdvice(careerPalace, wealthPalace);
    const text = buildText({ classification, careerPalace, wealthPalace, mingPalace, careerShape, daXianAdvice, riskAdvice });

    return {
        schemaVersion: 'mingpan-career-wealth-v0.1',
        topic: 'career-wealth',
        classification,
        text,
        cards: {
            mingPalace,
            careerPalace,
            wealthPalace,
            careerShape,
            daXianAdvice,
            riskAdvice,
        },
        evidence: {
            sourceModules: ['v7.3-T', 'v7.3-M', 'v7.3-R', 'v1.0.1-11'],
            scores: {
                career: classification.careerScore,
                wealth: classification.wealthScore,
            },
            relations: daXianAdvice.relations,
            palaceSymbols: {
                career: careerPalace.symbols,
                wealth: wealthPalace.symbols,
            },
        },
    };
}
