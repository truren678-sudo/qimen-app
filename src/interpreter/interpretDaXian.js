import {
    describeRelation,
    formatHarms,
    formatPalaceLabel,
    formatStrength,
    getPalaceByNum,
    getRelationFromSelfPalace,
    summarizePalaceTopics,
} from './palaceUtils.js';

function groupRelations(facts, daXianPalace) {
    const groups = {
        '他來生我': [],
        '比合': [],
        '他來剋我': [],
        '我去生他': [],
        '我去剋他': [],
        '未知': [],
    };

    facts.palaces
        .filter(p => p.num !== 5 && p.num !== daXianPalace.num)
        .forEach(palace => {
            const relationInfo = getRelationFromSelfPalace(daXianPalace, palace);
            groups[relationInfo.relation].push({
                palace,
                relation: relationInfo.relation,
                description: relationInfo.description,
            });
        });

    return groups;
}

function selectOpportunities(groups) {
    return [...groups['他來生我'], ...groups['我去剋他']]
        .filter(item => !['衰宮', '大衰宮'].includes(item.palace.strength.level))
        .slice(0, 4);
}

function selectChallenges(groups) {
    return [...groups['他來剋我'], ...groups['比合'], ...groups['我去生他']]
        .filter(item => item.palace.harms.length > 0 || ['衰宮', '大衰宮'].includes(item.palace.strength.level))
        .sort((a, b) => b.palace.harms.length - a.palace.harms.length)
        .slice(0, 4);
}

function describeGroup(name, items) {
    if (items.length === 0) return `${name}：暫無特別集中的宮位。`;
    const labels = items.map(item => `${formatPalaceLabel(item.palace)}（${summarizePalaceTopics([item.palace])}）`);
    return `${name}：${labels.join('、')}。`;
}

function buildText({ stage, daXianPalace, groups, opportunities, challenges }) {
    const range = stage.range ? `${stage.range.start}-${stage.range.end}歲` : '目前這個階段';
    const mainTopic = summarizePalaceTopics([daXianPalace]);
    const opportunityText = opportunities.length > 0
        ? `機會點比較集中在${opportunities.map(item => summarizePalaceTopics([item.palace])).join('、')}。這些領域不是完全不用努力，而是比較容易形成可推進的方向。`
        : '這個大限的機會點不算特別集中，適合先穩住主線，再慢慢擴張。';
    const challengeText = challenges.length > 0
        ? `挑戰點主要在${challenges.map(item => summarizePalaceTopics([item.palace])).join('、')}。這些地方需要先看風險，再看要不要投入。`
        : '這個大限沒有特別集中的高壓宮位，整體可以用較穩定的方式安排。';

    return [
        `${range}的大限落在${formatPalaceLabel(daXianPalace)}，這代表這十年的「我」會更關心${mainTopic}。${formatStrength(daXianPalace)}，四害狀態為${formatHarms(daXianPalace)}。`,
        opportunityText,
        challengeText,
        describeGroup('外界生助我的領域', groups['他來生我']),
        describeGroup('我需要用力掌控的領域', groups['我去剋他']),
        '大限的重點不是每一年都重新洗牌，而是先看這十年的事件結構，再用流年去定位哪一年容易被引動。',
    ].join('\n\n');
}

export function interpretCurrentDaXian(facts) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('interpretCurrentDaXian requires MingPan facts v0.1.');
    }

    const stage = facts.derived.currentDaXian;
    if (!stage) {
        return {
            schemaVersion: 'mingpan-daxian-v0.1',
            topic: 'current-daxian',
            text: '目前年齡超出已建立的大限資料範圍，暫時無法生成當前大限解讀。',
            cards: null,
            evidence: { sourceModules: ['v7.3-R', 'v7.3-S'] },
        };
    }

    const daXianPalace = getPalaceByNum(facts, stage.num);
    const groups = groupRelations(facts, daXianPalace);
    const opportunities = selectOpportunities(groups);
    const challenges = selectChallenges(groups);
    const text = buildText({ stage, daXianPalace, groups, opportunities, challenges });

    return {
        schemaVersion: 'mingpan-daxian-v0.1',
        topic: 'current-daxian',
        text,
        cards: {
            stage,
            daXianPalace,
            opportunities,
            challenges,
            relationGroups: groups,
        },
        evidence: {
            sourceModules: ['v7.3-R', 'v7.3-S', 'v7.3-M'],
            relationMeanings: {
                '他來生我': describeRelation('他來生我'),
                '比合': describeRelation('比合'),
                '他來剋我': describeRelation('他來剋我'),
                '我去生他': describeRelation('我去生他'),
                '我去剋他': describeRelation('我去剋他'),
            },
        },
    };
}

