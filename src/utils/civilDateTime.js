function isInteger(value) {
    return Number.isInteger(value);
}

function isLeapGregorianYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Return the number of days in a Gregorian calendar month.
 * Invalid years/months return 0 so callers can safely build empty option lists.
 */
export function daysInGregorianMonth(year, month) {
    if (!isInteger(year) || year < 1 || !isInteger(month) || month < 1 || month > 12) {
        return 0;
    }

    if (month === 2) return isLeapGregorianYear(year) ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidGregorianDate(parts = {}) {
    const { year, month, day } = parts;
    const maxDay = daysInGregorianMonth(year, month);
    return maxDay > 0 && isInteger(day) && day >= 1 && day <= maxDay;
}

export function isValidCivilTime(parts = {}) {
    const { hour, minute } = parts;
    return isInteger(hour) && hour >= 0 && hour <= 23
        && isInteger(minute) && minute >= 0 && minute <= 59;
}

/**
 * Add minutes to a wall-clock value using UTC fields as a host-independent
 * Gregorian arithmetic engine. No local timezone or DST rule is consulted.
 */
export function addCivilMinutes(parts, minutes) {
    if (!isValidGregorianDate(parts) || !isValidCivilTime(parts)) {
        throw new Error('Invalid civil date or time.');
    }
    if (!Number.isInteger(minutes)) {
        throw new Error('Civil minute adjustment must be an integer.');
    }

    // Start from a known UTC instant, then set the full year separately so
    // years 1-99 are not remapped to 1901-1999 by Date.UTC.
    const date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour, parts.minute + minutes, 0, 0);

    if (Number.isNaN(date.getTime())) {
        throw new Error('Civil date adjustment is outside the supported range.');
    }

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
    };
}

/**
 * Read a year from an explicit civil date without letting date-only strings
 * shift to the previous/next year in the host timezone.
 */
export function getCivilDateParts(value) {
    if (value == null || value === '') {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        };
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
        if (!isValidGregorianDate(value)) {
            throw new Error('Invalid as-of date.');
        }
        return { year: value.year, month: value.month, day: value.day };
    }

    if (typeof value === 'string') {
        const match = value.trim().match(/^(\d{4,})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/);
        if (match) {
            const parts = {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
            };
            if (!isValidGregorianDate(parts)) {
                throw new Error('Invalid as-of date.');
            }
            return parts;
        }
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid as-of date.');
    }
    // Date/timestamp 代表呼叫端裝置上的「當下」；採用裝置民用年份。
    // 需要跨時區固定語意時，呼叫端應傳 YYYY-MM-DD 或完整 parts。
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
}

export function getCivilYear(value) {
    return getCivilDateParts(value).year;
}

export function compareCivilDates(left, right) {
    if (!isValidGregorianDate(left) || !isValidGregorianDate(right)) {
        throw new Error('Cannot compare invalid civil dates.');
    }

    return (left.year - right.year)
        || (left.month - right.month)
        || (left.day - right.day);
}
