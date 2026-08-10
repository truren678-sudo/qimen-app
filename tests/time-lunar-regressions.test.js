import { describe, expect, it } from 'vitest';
import { calculateMingPan, normalizeMingPanBirthTime } from '../src/core/calculateMingPan.js';
import { buildMingPanFacts } from '../src/core/mingpanFacts.js';
import {
    addCivilMinutes,
    daysInGregorianMonth,
    isValidGregorianDate,
} from '../src/utils/civilDateTime.js';
import {
    daysInLunarMonth,
    getLunarMonthsOfYear,
} from '../src/utils/lunarDate.js';

function birthInput(date, overrides = {}) {
    return {
        birthDate: date,
        birthTime: { hour: 12, minute: 0 },
        useTrueSolarTime: false,
        ...overrides,
    };
}

function minimalMingPanResult(birthYear) {
    return {
        chartType: '命盤',
        gender: '男',
        solar: { year: birthYear, month: 1, day: 1 },
        lunar: {},
        siZhu: { dayGan: '甲', hourGan: '甲' },
        xunShou: '甲子旬',
        kongWang: '',
        yiMa: '',
        palaces: [],
    };
}

describe('Gregorian civil date validation', () => {
    it('uses real month lengths and Gregorian leap-year rules', () => {
        expect(daysInGregorianMonth(2024, 2)).toBe(29);
        expect(daysInGregorianMonth(2023, 2)).toBe(28);
        expect(daysInGregorianMonth(1900, 2)).toBe(28);
        expect(daysInGregorianMonth(2000, 2)).toBe(29);
        expect(isValidGregorianDate({ year: 2024, month: 2, day: 29 })).toBe(true);
        expect(isValidGregorianDate({ year: 2024, month: 2, day: 30 })).toBe(false);
    });

    it('rejects impossible Gregorian birth dates instead of normalizing them', () => {
        expect(() => normalizeMingPanBirthTime(
            birthInput({ year: 2024, month: 2, day: 30 }),
        )).toThrow('Invalid birth date or time.');
    });

    it('adds wall-clock minutes without applying host DST transitions', () => {
        expect(addCivilMinutes({
            year: 2024,
            month: 3,
            day: 10,
            hour: 1,
            minute: 30,
        }, 60)).toEqual({
            year: 2024,
            month: 3,
            day: 10,
            hour: 2,
            minute: 30,
        });

        expect(addCivilMinutes({
            year: 2024,
            month: 2,
            day: 29,
            hour: 23,
            minute: 45,
        }, 30)).toEqual({
            year: 2024,
            month: 3,
            day: 1,
            hour: 0,
            minute: 15,
        });
    });
});

describe('Lunar month and leap-month validation', () => {
    it('lists the 2023 leap second month in chronological order', () => {
        const months = getLunarMonthsOfYear(2023);
        expect(months).toHaveLength(13);
        expect(months.slice(1, 3)).toEqual([
            { month: 2, isLeap: false, dayCount: 30 },
            { month: 2, isLeap: true, dayCount: 29 },
        ]);
    });

    it('converts the leap month and retains its hour/minute', () => {
        const normalized = normalizeMingPanBirthTime(birthInput(
            { year: 2023, month: 2, day: 1 },
            {
                calendarType: 'lunar',
                lunarIsLeap: true,
                birthTime: { hour: 23, minute: 45 },
            },
        ));

        expect(normalized.normalized).toEqual({
            year: 2023,
            month: 3,
            day: 22,
            hour: 23,
            minute: 45,
        });
    });

    it('rejects nonexistent leap months and days beyond the selected lunar month', () => {
        expect(() => normalizeMingPanBirthTime(birthInput(
            { year: 2024, month: 2, day: 1 },
            { calendarType: 'lunar', lunarIsLeap: true },
        ))).toThrow('Invalid lunar birth date or time.');

        const maxDay = daysInLunarMonth(2023, 2, true);
        expect(() => normalizeMingPanBirthTime(birthInput(
            { year: 2023, month: 2, day: maxDay + 1 },
            { calendarType: 'lunar', lunarIsLeap: true },
        ))).toThrow('Invalid lunar birth date or time.');
    });
});

describe('Timezone-independent normalization', () => {
    it('preserves quarter-hour overseas offsets when converting to UTC+8', () => {
        const normalized = normalizeMingPanBirthTime(birthInput(
            { year: 2024, month: 1, day: 1 },
            {
                birthTime: { hour: 23, minute: 0 },
                birthLocation: { type: 'overseas', offset: 5.75 },
            },
        ));

        expect(normalized.normalized).toEqual({
            year: 2024,
            month: 1,
            day: 2,
            hour: 1,
            minute: 15,
        });
    });

    it('reads YYYY-MM-DD as a civil date when calculating nominal age', () => {
        const facts = buildMingPanFacts(minimalMingPanResult(2000), {
            asOfDate: '2026-01-01',
        });
        expect(facts.profile.nominalAge).toBe(27);
    });

  it('rejects an impossible as-of date', () => {
        expect(() => buildMingPanFacts(minimalMingPanResult(2000), {
            asOfDate: '2026-02-30',
        })).toThrow('Invalid as-of date.');

        expect(() => buildMingPanFacts(minimalMingPanResult(2000), {
            asOfDate: { year: 2026, month: 2, day: 30 },
        })).toThrow('Invalid as-of date.');
  });

  it('rejects a birth date later than the requested calculation date', () => {
    expect(() => calculateMingPan({
      birthDate: { year: 2026, month: 8, day: 11 },
      birthTime: { hour: 12, minute: 0 },
      gender: '男',
    }, {
      asOfDate: { year: 2026, month: 8, day: 10 },
    })).toThrow('Birth date cannot be later than the calculation date.');
  });

  it('checks future births before timezone normalization and keeps the civil birth year for age', () => {
    const sameCivilDay = calculateMingPan({
      birthDate: { year: 2026, month: 8, day: 10 },
      birthTime: { hour: 23, minute: 0 },
      gender: '男',
      birthLocation: { type: 'overseas', country: { offset: -8 } },
    }, {
      asOfDate: { year: 2026, month: 8, day: 10 },
    });

    expect(sameCivilDay.normalizedBirth.normalized).toMatchObject({ year: 2026, month: 8, day: 11 });

    const { facts, normalizedBirth } = calculateMingPan({
      birthDate: { year: 2025, month: 12, day: 31 },
      birthTime: { hour: 23, minute: 0 },
      gender: '男',
      birthLocation: { type: 'overseas', country: { offset: -8 } },
    }, {
      asOfDate: { year: 2026, month: 1, day: 1 },
    });

    expect(normalizedBirth.normalized).toMatchObject({ year: 2026, month: 1, day: 1 });
    expect(normalizedBirth.civilBirthDate).toEqual({ year: 2025, month: 12, day: 31 });
    expect(facts.profile.nominalAge).toBe(2);
  });

    it('generates annual timing through an explicitly requested future as-of year', () => {
        const { facts } = calculateMingPan({
            birthDate: { year: 2000, month: 1, day: 1 },
            birthTime: { hour: 12, minute: 0 },
            gender: '男',
            useTrueSolarTime: false,
        }, { asOfDate: '2074-01-01' });

        expect(facts.profile.nominalAge).toBe(75);
        expect(facts.derived.currentYearPalace).not.toBeNull();
        expect(
            facts.palaces.find(palace => palace.num === facts.derived.currentYearPalace.num).liuNianAges,
        ).toContain(75);
    });
});
