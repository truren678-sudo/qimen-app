import { describe, expect, it } from 'vitest';
import { Solar } from 'lunar-javascript';
import { findSolarFromBazi } from '../src/utils/baziUtils';

describe('四柱反查', () => {
  it('能找回晚子時 23:00 的原始日期', () => {
    const eightChar = Solar.fromYmdHms(1990, 1, 15, 23, 0, 0).getLunar().getEightChar();
    const matches = findSolarFromBazi(
      eightChar.getYear(),
      eightChar.getMonth(),
      eightChar.getDay(),
      eightChar.getTime(),
    );

    expect(matches.some(date => (
      date.getFullYear() === 1990 &&
      date.getMonth() === 0 &&
      date.getDate() === 15 &&
      date.getHours() === 23
    ))).toBe(true);
  });
});
