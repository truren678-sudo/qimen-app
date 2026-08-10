import { calculateQimen } from '../qimen.js';
import { calcSolarTimeCorrectionMinutes } from '../data/locationData.js';
import {
    addCivilMinutes,
    compareCivilDates,
    getCivilDateParts,
    isValidCivilTime,
    isValidGregorianDate,
} from '../utils/civilDateTime.js';
import { isValidLunarDate, lunarToSolarParts } from '../utils/lunarDate.js';
import { buildMingPanFacts } from './mingpanFacts.js';

function toInt(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function extractBirthParts(input) {
    const birthDate = input.birthDate || input.date || input;
    const birthTime = input.birthTime || input.time || input;

    return {
        year: toInt(birthDate.year),
        month: toInt(birthDate.month),
        day: toInt(birthDate.day),
        hour: toInt(birthTime.hour),
        minute: toInt(birthTime.minute),
    };
}

function assertValidGregorianParts(parts) {
    if (!isValidGregorianDate(parts) || !isValidCivilTime(parts)) {
        throw new Error('Invalid birth date or time.');
    }
}

function convertLunarToSolar(parts, isLeapMonth = false) {
    if (!isValidCivilTime(parts) || !isValidLunarDate(parts, isLeapMonth)) {
        throw new Error('Invalid lunar birth date or time.');
    }
    return lunarToSolarParts(parts, isLeapMonth);
}

function convertOverseasToChinaTime(parts, location, isDst) {
    const country = location.country || location;
    const offset = Number(country.offset);
    const dstOffset = country.dstOffset == null ? null : Number(country.dstOffset);
    const effectiveOffset = isDst && dstOffset != null ? dstOffset : offset;

    if (!Number.isFinite(effectiveOffset)) {
        throw new Error('Overseas birth location requires a valid UTC offset.');
    }

    return addCivilMinutes(parts, Math.round((8 - effectiveOffset) * 60));
}

function getChinaCity(location) {
    if (!location) return null;
    if (location.city?.lng != null) return location.city;
    if (location.lng != null) return location;
    return null;
}

export function normalizeMingPanBirthTime(input = {}) {
    const calendarType = input.calendarType || 'solar';
    const isDst = Boolean(input.isDst);
    const useTrueSolarTime = input.useTrueSolarTime !== false;
    const location = input.birthLocation || input.location || null;
    const adjustments = [];

    let params = extractBirthParts(input);

    if (calendarType === 'lunar') {
        const before = params;
        params = convertLunarToSolar(params, Boolean(input.isLeapMonth || input.lunarIsLeap));
        adjustments.push({ type: 'lunar-to-solar', before, after: params });
    } else {
        assertValidGregorianParts(params);
    }

    // 年齡與「是否為未來出生」以出生地的公曆民用日期為準；
    // 後續 UTC+8、夏令與經度修正只影響排盤時刻。
    const civilBirthDate = { year: params.year, month: params.month, day: params.day };

    if (location?.type === 'overseas' || location?.country || location?.offset != null) {
        const before = params;
        params = convertOverseasToChinaTime(params, location, isDst);
        adjustments.push({ type: 'overseas-to-utc8', before, after: params });
    }

    if (isDst && (!location || location.type === 'china' || location.city || location.lng != null)) {
        const before = params;
        params = addCivilMinutes(params, -60);
        adjustments.push({ type: 'china-dst-minus-60-minutes', before, after: params });
    }

    const chinaCity = getChinaCity(location);
    if (useTrueSolarTime && chinaCity) {
        const minutes = calcSolarTimeCorrectionMinutes(chinaCity.lng);
        if (minutes !== 0) {
            const before = params;
            params = addCivilMinutes(params, minutes);
            adjustments.push({ type: 'true-solar-time', minutes, before, after: params });
        }
    }

    return {
        input: extractBirthParts(input),
        normalized: params,
        calendarType,
        isDst,
        useTrueSolarTime,
        location,
        civilBirthDate,
        adjustments,
    };
}

export function calculateMingPan(input = {}, options = {}) {
    const normalizedBirth = normalizeMingPanBirthTime(input);
    const { year, month, day, hour, minute } = normalizedBirth.normalized;
    const gender = input.gender || options.gender || '男';
    const asOfDate = options.asOfDate || input.asOfDate;
    const asOfParts = getCivilDateParts(asOfDate);
    if (compareCivilDates(normalizedBirth.civilBirthDate, asOfParts) > 0) {
        throw new Error('Birth date cannot be later than the calculation date.');
    }
    const requestedNominalAge = asOfParts.year - normalizedBirth.civilBirthDate.year + 1;

    const result = calculateQimen(year, month, day, hour, minute, {
        chartType: '命盤',
        gender,
        liuNianEndAge: requestedNominalAge,
    });

    if (!result) {
        throw new Error('Ming pan calculation failed.');
    }

    const facts = buildMingPanFacts(result, {
        asOfDate,
        birthDate: normalizedBirth.civilBirthDate,
    });

    return {
        result,
        facts,
        normalizedBirth,
    };
}

export { buildMingPanFacts };
