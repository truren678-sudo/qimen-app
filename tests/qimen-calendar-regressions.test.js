import { describe, expect, it } from 'vitest';
import { calculateQimen } from '../src/qimen';
import { checkAuspiciousDirection, getDailyAuspiciousData } from '../src/qimenCalendar';
import { generateBehaviorGuide } from '../src/utils/behaviorFengShui';

describe('奇門曆吉方四害篩選', () => {
    it('2026/08/09 午時震三宮有戊擊刑時不再推薦東方', () => {
        const daily = getDailyAuspiciousData(2026, 8, 9);
        const noon = daily.hourCharts.find(slot => slot.timeRange === '11:00-13:00');
        const east = noon.chart.palaces.find(palace => palace.num === 3);

        expect(east.tianGanExtra).toBe('戊');
        expect(east.tianGanExtraHarm).toBe('刑');
        expect(east.filterResult).toEqual({
            isAuspicious: false,
            reasons: ['天干寄干擊刑'],
        });
        expect(noon.chart.palaces
            .filter(palace => palace.filterResult.isAuspicious)
            .map(palace => palace.num)).not.toContain(3);
    });

    it.each([
        ['tianGanHarm', '刑', '天干擊刑'],
        ['tianGanExtraHarm', '刑', '天干寄干擊刑'],
        ['diGanHarm', '刑墓', '地干擊刑'],
        ['diGanExtraHarm', '刑', '地干寄干擊刑'],
    ])('排除 %s 上的擊刑', (field, harm, reason) => {
        const palace = {
            num: 2,
            door: '開門',
            shen: '太陰',
            tianGanHarm: '',
            tianGanExtraHarm: '',
            diGanHarm: '',
            diGanExtraHarm: '',
            [field]: harm,
        };
        const chart = {
            chartType: '時家置閏',
            kongWang: '',
            siZhu: { dayGan: '甲', hourGan: '丙' },
        };

        expect(checkAuspiciousDirection(palace, chart)).toEqual({
            isAuspicious: false,
            reasons: [reason],
        });
    });

    it('行為風水也會擋下寄干擊刑的宮位', () => {
        const chart = calculateQimen(2026, 8, 9, 12, 30, { chartType: '時家置閏' });
        const east = chart.palaces.find(palace => palace.num === 3);
        const guide = generateBehaviorGuide(east, chart);

        expect(guide.status).toBe('blocked');
        expect(guide.blockReasons).toContain('天干寄干擊刑');
    });

    it('行為風水的入墓提示會納入寄干', () => {
        const palace = {
            num: 2,
            door: '開門',
            shen: '太陰',
            star: '天心',
            tianGan: '丙',
            diGan: '乙',
            tianGanHarm: '',
            tianGanExtraHarm: '墓',
            diGanHarm: '',
            diGanExtraHarm: '',
        };
        const chart = {
            chartType: '陰盤奇門',
            kongWang: '',
            siZhu: { hourZhi: '午' },
        };

        const guide = generateBehaviorGuide(palace, chart);
        expect(guide.status).toBe('ok');
        expect(guide.safetyNote).toContain('入墓');
    });
});
