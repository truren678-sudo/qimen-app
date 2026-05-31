import { interpretAnnualTiming } from './interpretAnnualTiming.js';
import { interpretCareerWealth } from './interpretCareerWealth.js';
import { interpretCurrentDaXian } from './interpretDaXian.js';
import { interpretHealth } from './interpretHealth.js';
import { interpretOverview } from './interpretOverview.js';
import { interpretPalace } from './interpretPalace.js';
import { interpretRelationship } from './interpretRelationship.js';
import { interpretTalent } from './interpretTalent.js';
import { validateMingPanResponseText } from './promptPolicy.js';

const PERSONNEL_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];

function getProfileTitle(facts, displayName = '') {
    const name = displayName || '命主';
    const { solar, siZhu, gender } = facts.profile;
    return `${name}｜${gender || ''}命｜${solar.year}/${solar.month}/${solar.day} ${solar.hour}:${String(solar.minute).padStart(2, '0')}｜${siZhu.yearGan}${siZhu.yearZhi} ${siZhu.monthGan}${siZhu.monthZhi} ${siZhu.dayGan}${siZhu.dayZhi} ${siZhu.hourGan}${siZhu.hourZhi}`;
}

function buildPalaceReadings(facts) {
    return PERSONNEL_ORDER.map(name => interpretPalace(facts, name));
}

function section(id, title, reading) {
    return {
        id,
        title,
        schemaVersion: reading.schemaVersion,
        text: reading.text,
        cards: reading.cards,
        evidence: reading.evidence,
    };
}

function buildReportMarkdown(reading) {
    const lines = [];
    lines.push(`# 九宮奇門命盤解讀`);
    lines.push('');
    lines.push(`> ${reading.profileTitle}`);
    lines.push('');
    lines.push('本報告為九宮奇門命盤的結構化解讀，內容作為自我理解與生活決策參考，不替代醫療、法律、心理或財務等專業建議。');
    lines.push('');

    reading.sections.forEach(sec => {
        lines.push(`## ${sec.title}`);
        lines.push('');
        lines.push(sec.text);
        lines.push('');
    });

    lines.push('## 十二宮速覽');
    lines.push('');
    reading.palaceReadings.forEach(item => {
        const palaceNames = item.palace.personnel12.map(p => p.name).join('、') || `${item.palace.fullName}${item.palace.num}宮`;
        lines.push(`### ${palaceNames}`);
        lines.push('');
        lines.push(item.text);
        lines.push('');
    });

    lines.push('## 依據與邊界');
    lines.push('');
    lines.push(`- Facts schema: ${reading.factsSchemaVersion}`);
    lines.push(`- Reading schema: ${reading.schemaVersion}`);
    lines.push(`- Policy check: ${reading.policyCheck.ok ? '通過' : `需檢查 ${reading.policyCheck.violations.join('、')}`}`);
    lines.push('- 解讀原則：不絕對化、不恐嚇、不跨命理系統，風險提示需附帶調整方向。');

    return lines.join('\n');
}

export function generateMingPanReading(facts, options = {}) {
    if (!facts || facts.schemaVersion !== 'mingpan-facts-v0.1') {
        throw new Error('generateMingPanReading requires MingPan facts v0.1.');
    }

    const overview = interpretOverview(facts);
    const careerWealth = interpretCareerWealth(facts);
    const currentDaXian = interpretCurrentDaXian(facts);
    const relationship = interpretRelationship(facts);
    const talent = interpretTalent(facts);
    const health = interpretHealth(facts);
    const annualTiming = interpretAnnualTiming(facts, options.annualTiming || {});
    const palaceReadings = buildPalaceReadings(facts);

    const sections = [
        section('overview', '命盤總覽', overview),
        section('career-wealth', '事業財富', careerWealth),
        section('current-daxian', '當前大限', currentDaXian),
        section('relationship', '婚戀感情', relationship),
        section('talent', '個性天賦', talent),
        section('health-risk', '身心風險提醒', health),
        section('annual-timing', '年度提示', annualTiming),
    ];

    const textForPolicy = [
        ...sections.map(item => item.text),
        ...palaceReadings.map(item => item.text),
    ].join('\n\n');

    const reading = {
        schemaVersion: 'mingpan-reading-v0.1',
        factsSchemaVersion: facts.schemaVersion,
        profileTitle: getProfileTitle(facts, options.displayName),
        generatedAt: options.generatedAt || new Date().toISOString(),
        sections,
        palaceReadings,
        sourceReadings: {
            overview,
            careerWealth,
            currentDaXian,
            relationship,
            talent,
            health,
            annualTiming,
        },
        policyCheck: validateMingPanResponseText(textForPolicy),
    };

    return {
        ...reading,
        reportMarkdown: buildReportMarkdown(reading),
    };
}

export { PERSONNEL_ORDER };

