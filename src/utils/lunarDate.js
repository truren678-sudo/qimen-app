import { Lunar, LunarYear } from 'lunar-javascript';

function assertLunarYearAndMonth(year, month) {
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error('Invalid lunar year or month.');
    }
}

export function getLunarMonthsOfYear(year) {
    if (!Number.isInteger(year) || year < 1) return [];

    try {
        return LunarYear.fromYear(year).getMonthsInYear().map(month => {
            const signedMonth = month.getMonth();
            return {
                month: Math.abs(signedMonth),
                isLeap: signedMonth < 0,
                dayCount: month.getDayCount(),
            };
        });
    } catch {
        return [];
    }
}

export function getLunarMonth(year, month, isLeap = false) {
    assertLunarYearAndMonth(year, month);
    const signedMonth = isLeap ? -month : month;
    const lunarMonth = LunarYear.fromYear(year).getMonth(signedMonth);
    if (!lunarMonth) {
        throw new Error(`Invalid lunar month: ${year}-${isLeap ? 'leap-' : ''}${month}.`);
    }
    return lunarMonth;
}

export function daysInLunarMonth(year, month, isLeap = false) {
    try {
        return getLunarMonth(year, month, isLeap).getDayCount();
    } catch {
        return 0;
    }
}

export function isValidLunarDate(parts = {}, isLeap = false) {
    const maxDay = daysInLunarMonth(parts.year, parts.month, isLeap);
    return maxDay > 0 && Number.isInteger(parts.day) && parts.day >= 1 && parts.day <= maxDay;
}

export function lunarToSolarParts(parts, isLeap = false) {
    if (!isValidLunarDate(parts, isLeap)) {
        throw new Error('Invalid lunar date.');
    }

    const signedMonth = isLeap ? -parts.month : parts.month;
    const solar = Lunar.fromYmd(parts.year, signedMonth, parts.day).getSolar();
    return {
        year: solar.getYear(),
        month: solar.getMonth(),
        day: solar.getDay(),
        hour: parts.hour,
        minute: parts.minute,
    };
}
