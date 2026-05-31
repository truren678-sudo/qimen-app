import { Lunar } from 'lunar-javascript';
import { calculateQimen } from '../qimen.js';
import { calcSolarTimeCorrectionMinutes } from '../data/locationData.js';
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

function assertValidParts(parts) {
    const { year, month, day, hour, minute } = parts;
    if (!year || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error('Invalid birth date or time.');
    }
}

function addMinutes(parts, minutes) {
    const d = new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute + minutes);
    return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
    };
}

function convertLunarToSolar(parts, isLeapMonth = false) {
    const lunarMonth = isLeapMonth ? -parts.month : parts.month;
    const solar = Lunar.fromYmd(parts.year, lunarMonth, parts.day).getSolar();
    return {
        year: solar.getYear(),
        month: solar.getMonth(),
        day: solar.getDay(),
        hour: parts.hour,
        minute: parts.minute,
    };
}

function convertOverseasToChinaTime(parts, location, isDst) {
    const country = location.country || location;
    const offset = Number(country.offset);
    const dstOffset = country.dstOffset == null ? null : Number(country.dstOffset);
    const effectiveOffset = isDst && dstOffset != null ? dstOffset : offset;

    if (!Number.isFinite(effectiveOffset)) {
        throw new Error('Overseas birth location requires a valid UTC offset.');
    }

    const chinaOffset = 8;
    const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour - effectiveOffset, parts.minute));
    d.setUTCHours(d.getUTCHours() + chinaOffset);

    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
    };
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
    assertValidParts(params);

    if (calendarType === 'lunar') {
        const before = params;
        params = convertLunarToSolar(params, Boolean(input.isLeapMonth || input.lunarIsLeap));
        adjustments.push({ type: 'lunar-to-solar', before, after: params });
    }

    if (location?.type === 'overseas' || location?.country || location?.offset != null) {
        const before = params;
        params = convertOverseasToChinaTime(params, location, isDst);
        adjustments.push({ type: 'overseas-to-utc8', before, after: params });
    }

    if (isDst && (!location || location.type === 'china' || location.city || location.lng != null)) {
        const before = params;
        params = addMinutes(params, -60);
        adjustments.push({ type: 'china-dst-minus-60-minutes', before, after: params });
    }

    const chinaCity = getChinaCity(location);
    if (useTrueSolarTime && chinaCity) {
        const minutes = calcSolarTimeCorrectionMinutes(chinaCity.lng);
        if (minutes !== 0) {
            const before = params;
            params = addMinutes(params, minutes);
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
        adjustments,
    };
}

export function calculateMingPan(input = {}, options = {}) {
    const normalizedBirth = normalizeMingPanBirthTime(input);
    const { year, month, day, hour, minute } = normalizedBirth.normalized;
    const gender = input.gender || options.gender || '男';

    const result = calculateQimen(year, month, day, hour, minute, {
        chartType: '命盤',
        gender,
    });

    if (!result) {
        throw new Error('Ming pan calculation failed.');
    }

    const facts = buildMingPanFacts(result, {
        asOfDate: options.asOfDate || input.asOfDate,
    });

    return {
        result,
        facts,
        normalizedBirth,
    };
}

export { buildMingPanFacts };
