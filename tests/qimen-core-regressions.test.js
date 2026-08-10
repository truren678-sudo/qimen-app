import { describe, expect, it } from 'vitest';
import { calculateQimen } from '../src/qimen';

const DAY_QIMEN_STARS = [
  '太乙', '攝提', '軒轅', '招搖', '天符', '青龍', '咸池', '太陰', '天乙',
];

function getDaXianRanges(result) {
  return result.palaces
    .map(palace => palace.daXian)
    .filter(Boolean)
    .sort((left, right) => left.start - right.start);
}

function expectContinuousNonOverlappingRanges(ranges) {
  expect(ranges).toHaveLength(9);

  for (let index = 1; index < ranges.length; index += 1) {
    expect(ranges[index].start).toBe(ranges[index - 1].end + 1);
    expect(ranges[index].end - ranges[index].start + 1).toBe(10);
  }

  for (let age = ranges[0].start; age <= ranges.at(-1).end; age += 1) {
    const owners = ranges.filter(range => age >= range.start && age <= range.end);
    expect(owners, `virtual age ${age} should belong to exactly one da xian`).toHaveLength(1);
  }
}

describe('日家奇門專用分支', () => {
  it('回傳日家標記並以太乙九星排滿九宮', () => {
    const result = calculateQimen(2024, 1, 15, 12, 0, { chartType: '日家奇門' });

    expect(result.isDayQimen).toBe(true);
    expect(result.xunShou).toBe('甲戌旬');
    expect(result.palaces.map(palace => palace.star).sort()).toEqual([...DAY_QIMEN_STARS].sort());
    expect(Object.fromEntries(result.palaces.map(palace => [palace.num, palace.star]))).toEqual({
      1: '咸池',
      2: '太陰',
      3: '天乙',
      4: '太乙',
      5: '攝提',
      6: '軒轅',
      7: '招搖',
      8: '天符',
      9: '青龍',
    });
    expect(result.palaces.every(palace => palace.diGan === '' && palace.shen === '')).toBe(true);
    expect(result.palaces.find(palace => palace.num === 5).tianGan).toBe('陽戊寅日');
  });

  it('依節氣曆日前一晚 23:00 切換陰陽遁', () => {
    const beforeSummer = calculateQimen(2026, 6, 20, 22, 59, { chartType: '日家奇門' });
    const atSummer = calculateQimen(2026, 6, 20, 23, 0, { chartType: '日家奇門' });
    const beforeWinter = calculateQimen(2026, 12, 21, 22, 59, { chartType: '日家奇門' });
    const atWinter = calculateQimen(2026, 12, 21, 23, 0, { chartType: '日家奇門' });

    expect(beforeSummer.yinYang).toBe('陽');
    expect(atSummer.yinYang).toBe('陰');
    expect(beforeWinter.yinYang).toBe('陰');
    expect(atWinter.yinYang).toBe('陽');
  });

  it('晚子時使用隔日的日柱，並跟隨該年度實際冬至曆日', () => {
    const atLateZi = calculateQimen(2026, 12, 21, 23, 0, { chartType: '日家奇門' });
    const nextDay = calculateQimen(2026, 12, 22, 0, 0, { chartType: '日家奇門' });
    const beforeEarlyWinterBoundary = calculateQimen(2024, 12, 20, 22, 59, { chartType: '日家奇門' });
    const atEarlyWinterBoundary = calculateQimen(2024, 12, 20, 23, 0, { chartType: '日家奇門' });

    expect(atLateZi.siZhu.dayGan).toBe(nextDay.siZhu.dayGan);
    expect(atLateZi.siZhu.dayZhi).toBe(nextDay.siZhu.dayZhi);
    expect(beforeEarlyWinterBoundary.yinYang).toBe('陰');
    expect(atEarlyWinterBoundary.yinYang).toBe('陽');
  });
});

describe('公曆輸入驗證', () => {
  it('拒絕不存在的日期，不讓底層曆法靜默換成隔月', () => {
    expect(calculateQimen(2024, 2, 31, 12, 0)).toBeNull();
    expect(calculateQimen(2025, 2, 29, 12, 0)).toBeNull();
    expect(calculateQimen(2024, 2, 29, 12, 0)).not.toBeNull();
  });
});

describe('年家奇門換年基準', () => {
  it('元運與年柱都在立春換年，不在元旦提前切局', () => {
    const yearEnd = calculateQimen(2003, 12, 31, 12, 0, { chartType: '年家奇門' });
    const newYearBeforeLichun = calculateQimen(2004, 1, 1, 12, 0, { chartType: '年家奇門' });
    const afterLichun = calculateQimen(2004, 2, 5, 12, 0, { chartType: '年家奇門' });

    expect(`${newYearBeforeLichun.siZhu.yearGan}${newYearBeforeLichun.siZhu.yearZhi}`).toBe('癸未');
    expect(newYearBeforeLichun.juNum).toBe(yearEnd.juNum);
    expect(newYearBeforeLichun.yuanName).toBe(yearEnd.yuanName);
    expect(`${afterLichun.siZhu.yearGan}${afterLichun.siZhu.yearZhi}`).toBe('甲申');
    expect(afterLichun.juNum).not.toBe(newYearBeforeLichun.juNum);
  });
});

describe('命盤大限區間', () => {
  it('一般局數的第二限從第一限終點的下一歲開始', () => {
    const result = calculateQimen(1993, 7, 25, 18, 50, { chartType: '命盤', gender: '男' });
    const ranges = getDaXianRanges(result);

    expect(result.juNum).toBe(5);
    expect(ranges.slice(0, 3)).toEqual([
      { start: 1, end: 5 },
      { start: 6, end: 15 },
      { start: 16, end: 25 },
    ]);
    expectContinuousNonOverlappingRanges(ranges);
  });

  it('一局保留首限 1–10 歲的特例，之後仍連續且不重疊', () => {
    const result = calculateQimen(2024, 8, 15, 12, 0, { chartType: '命盤', gender: '女' });
    const ranges = getDaXianRanges(result);

    expect(result.juNum).toBe(1);
    expect(ranges.slice(0, 3)).toEqual([
      { start: 1, end: 10 },
      { start: 11, end: 20 },
      { start: 21, end: 30 },
    ]);
    expectContinuousNonOverlappingRanges(ranges);
  });
});

describe('命盤流年範圍', () => {
  it('為 1930 年出生者生成至少到當前虛歲的流年', () => {
    const birthYear = 1930;
    const currentNominalAge = new Date().getFullYear() - birthYear + 1;
    const result = calculateQimen(birthYear, 1, 1, 12, 0, { chartType: '命盤', gender: '男' });
    const ages = result.palaces
      .flatMap(palace => palace.liuNianAges)
      .sort((left, right) => left - right);

    expect(currentNominalAge).toBeGreaterThan(70);
    expect(ages).toEqual(Array.from({ length: currentNominalAge }, (_, index) => index + 1));
  });
});
