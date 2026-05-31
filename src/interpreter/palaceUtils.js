export const PALACE_TOPIC = {
    '命宮': '自我定位與人生主軸',
    '兄弟': '手足、同輩與近身支持',
    '夫妻': '伴侶關係與親密互動',
    '子女': '子女、作品與延伸成果',
    '財帛': '財務節奏與資源掌握',
    '疾厄': '身心狀態與壓力管理',
    '遷移': '外部機會、移動與變化',
    '交友': '朋友、人脈與合作圈',
    '事業': '職涯舞台與成就方式',
    '田宅': '家庭、資產與安定感',
    '福德': '精神狀態與長期滿足',
    '父母': '長輩、制度與原生支持',
};

export const STRENGTH_COPY = {
    '大旺宮': '能量明顯，容易形成優勢',
    '旺宮': '狀態穩定，適合投入經營',
    '小衰宮': '有可用之處，但需要多一點策略',
    '衰宮': '容易遇到阻力，適合謹慎推進',
    '大衰宮': '壓力較集中，需要降低硬碰硬的成本',
};

const GENERATES = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木',
};

const CONTROLS = {
    '木': '土',
    '土': '水',
    '水': '火',
    '火': '金',
    '金': '木',
};

const RELATION_COPY = {
    '他來生我': '外部較容易給你支持，做起來比較順手',
    '比合': '牽連較深，容易互相影響',
    '他來剋我': '外在壓力較明顯，需要先處理阻力',
    '我去生他': '你會主動投入，但也容易消耗能量',
    '我去剋他': '需要用力推動，努力後才比較能拿到結果',
    '未知': '關係暫時無法判定',
};

export function getPalaceByNum(facts, num) {
    return facts.palaces.find(p => p.num === num) || null;
}

export function getPalaceByPersonnel(facts, personnelName) {
    return facts.palaces.find(p => p.personnel12?.some(item => item.name === personnelName)) || null;
}

export function getPalacesByStem(facts, stem) {
    if (!stem) return [];
    return facts.palaces.filter(palace => {
        const values = [
            palace.symbols?.tianGan,
            palace.symbols?.tianGanExtra,
            palace.symbols?.diGan,
            palace.symbols?.diGanExtra,
        ];
        return values.some(value => value && Array.from(value).includes(stem));
    });
}

export function getPalaceByDerived(facts, key) {
    const ref = facts.derived?.[key];
    return ref?.num ? getPalaceByNum(facts, ref.num) : null;
}

export function getPrimaryPersonnel(palace) {
    return palace?.personnel12?.[0]?.name || '';
}

export function getPrimaryTopic(palace) {
    const first = getPrimaryPersonnel(palace);
    return first ? (PALACE_TOPIC[first] || first) : '這個人生領域';
}

export function formatPalaceLabel(palace) {
    if (!palace) return '';
    const topics = (palace.personnel12 || []).map(p => p.name).filter(Boolean);
    const topicText = topics.length > 0 ? `（${topics.join('、')}）` : '';
    return `${palace.fullName || palace.name}${palace.num}宮${topicText}`;
}

export function formatStrength(palace) {
    return STRENGTH_COPY[palace?.strength?.level] || '狀態需要進一步觀察';
}

export function formatHarms(palace) {
    const harms = palace?.harms?.map(h => h.type) || [];
    if (harms.length === 0) return '無明顯四害';
    return harms.join('、');
}

export function getEffectivePalaceScore(palace) {
    if (!palace) return 0;
    const severePenalty = palace.harms.filter(h => ['刑', '擊刑', '刑墓', '門迫', '空亡'].includes(h.type)).length * 20;
    const tombPenalty = palace.harms.filter(h => ['墓', '入墓'].includes(h.type)).length * 10;
    return Math.max(0, palace.luck.score - severePenalty - tombPenalty);
}

export function getElementRelation(selfElement, targetElement) {
    if (!selfElement || !targetElement) return '未知';
    if (selfElement === targetElement) return '比合';
    if (GENERATES[targetElement] === selfElement) return '他來生我';
    if (CONTROLS[targetElement] === selfElement) return '他來剋我';
    if (GENERATES[selfElement] === targetElement) return '我去生他';
    if (CONTROLS[selfElement] === targetElement) return '我去剋他';
    return '未知';
}

export function describeRelation(relation) {
    return RELATION_COPY[relation] || RELATION_COPY['未知'];
}

export function getRelationFromSelfPalace(selfPalace, targetPalace) {
    return {
        relation: getElementRelation(selfPalace?.element, targetPalace?.element),
        description: describeRelation(getElementRelation(selfPalace?.element, targetPalace?.element)),
        self: selfPalace ? { num: selfPalace.num, name: selfPalace.fullName, element: selfPalace.element } : null,
        target: targetPalace ? { num: targetPalace.num, name: targetPalace.fullName, element: targetPalace.element } : null,
    };
}

export function summarizePalaceTopics(palaces) {
    return palaces
        .flatMap(p => p.personnel12?.map(item => item.name) || [])
        .filter(Boolean)
        .join('、') || '相關領域';
}
