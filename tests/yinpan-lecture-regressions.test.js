import { describe, expect, it } from 'vitest';
import { calculateQimen, findStemPalace, getSiZhu } from '../src/qimen';

// 範例盤取自子奇老師《陰盤奇門》二階 2-1 講義
function yinGanByPalace(result) {
  return Object.fromEntries(
    result.palaces.filter(p => p.num !== 5).map(p => [p.num, p.yinGan]),
  );
}

describe('陰盤奇門引干', () => {
  it('一般盤：時干加值使門後依天盤順序順排（含寄干）', () => {
    const result = calculateQimen(2016, 12, 14, 9, 12, { chartType: '陰盤奇門' });
    expect(result.juNum).toBe(6);
    expect(yinGanByPalace(result)).toEqual({
      1: '丁', 2: '丙', 3: '乙', 4: '戊', 6: '庚', 7: '辛', 8: '壬己', 9: '癸',
    });
    expect(result.palaces.find(p => p.num === 7).door).toBe('死門');
  });

  it('值使門落中宮寄坤二宮', () => {
    const result = calculateQimen(2014, 12, 27, 15, 50, { chartType: '陰盤奇門' });
    expect(result.palaces.find(p => p.num === 2).door).toBe('休門');
    expect(yinGanByPalace(result)).toEqual({
      1: '丁', 2: '戊', 3: '辛', 4: '癸乙', 6: '庚', 7: '壬', 8: '丙', 9: '己',
    });
  });

  it('引干特例：天地引三干相同時，時干入中依九宮陰逆飛佈', () => {
    const result = calculateQimen(1984, 6, 28, 3, 0, { chartType: '陰盤奇門' });
    expect(result.juNum).toBe(2);
    expect(yinGanByPalace(result)).toEqual({
      1: '戊', 2: '乙癸', 3: '丙', 4: '丁', 6: '壬', 7: '辛', 8: '庚', 9: '己',
    });
  });

  it('引干再特例：時干為中宮寄干時，改用原宮位天盤干入中', () => {
    const result = calculateQimen(2012, 3, 31, 4, 30, { chartType: '陰盤奇門' });
    expect(result.juNum).toBe(3);
    expect(yinGanByPalace(result)).toEqual({
      1: '壬', 2: '癸乙', 3: '丁', 4: '丙', 6: '戊', 7: '己', 8: '庚', 9: '辛',
    });
  });
});

describe('晚子時換日', () => {
  it('23:00 起日柱取隔天，時柱依隔天日干起', () => {
    expect(getSiZhu(2024, 8, 24, 22, 30)).toMatchObject({ dayGan: '庚', dayZhi: '申' });
    expect(getSiZhu(2024, 8, 24, 23, 30)).toMatchObject({ dayGan: '辛', dayZhi: '酉', hourGan: '戊', hourZhi: '子' });
  });
});

// 以下對照子奇老師網站排盤結果確認
describe('陰盤陰陽遁依實際節氣（不置閏）', () => {
  it('2024/6/17 仍在芒種，為陽遁2局', () => {
    const result = calculateQimen(2024, 6, 17, 12, 0, { chartType: '陰盤奇門' });
    expect(result.yinYang + result.juNum).toBe('陽2');
    expect(result.jieqiName).toBe('芒種');
  });

  it('2024/12/23 已過冬至，為陽遁1局', () => {
    const result = calculateQimen(2024, 12, 23, 12, 0, { chartType: '陰盤奇門' });
    expect(result.yinYang + result.juNum).toBe('陽1');
    expect(result.jieqiName).toBe('冬至');
  });
});

describe('陰盤局數以立春換年的年支計算', () => {
  it('立春後、春節前取新年支', () => {
    expect(calculateQimen(2026, 2, 10, 10, 0, { chartType: '陰盤奇門' }).juNum).toBe(3);
  });

  it('春節後、立春前取舊年支', () => {
    expect(calculateQimen(2025, 1, 31, 10, 0, { chartType: '陰盤奇門' }).juNum).toBe(6);
  });
});

// 以下對照群組案例的子奇門網站截圖（app.tzchimen.com）
describe('群組案例：網站截圖逐宮比對', () => {
  const pick = r => Object.fromEntries(r.palaces.filter(p => p.num !== 5).map(p => [
    p.num,
    `${p.shen}${p.star}${p.door} ${p.tianGan}${p.tianGanExtra}/${p.diGan}${p.diGanExtra} 引${p.yinGan}`,
  ]));

  it('符頭入中宮：值符借坤二宮天芮（2026/6/26 23:25 陰8局）', () => {
    const r = calculateQimen(2026, 6, 26, 23, 25, { chartType: '陰盤奇門' });
    expect(r.siZhu).toMatchObject({ dayGan: '壬', dayZhi: '申', hourGan: '庚', hourZhi: '子', lunarMonth: 5, lunarDay: 13 });
    expect([r.zhiFuXing, r.zhiShiMen]).toEqual(['天芮', '死門']);
    expect(pick(r)).toEqual({
      4: '白虎天任開門 戊/壬 引戊', 9: '六合天沖休門 癸/乙 引癸', 2: '太陰天輔生門 壬/丁辛 引壬',
      3: '玄武天蓬驚門 丙/癸 引丙', 7: '騰蛇天英傷門 乙/己 引乙', 8: '九地天心死門 庚/戊 引庚',
      1: '九天天柱景門 己/丙 引己', 6: '值符天芮杜門 丁辛/庚 引丁辛',
    });
  });

  it('伏吟引干特例（2026/5/15 20:03 陽5局）', () => {
    const r = calculateQimen(2026, 5, 15, 20, 3, { chartType: '陰盤奇門' });
    expect(pick(r)).toEqual({
      4: '白虎天輔杜門 乙/乙 引戊', 9: '玄武天英景門 壬/壬 引癸', 2: '九地天芮死門 丁戊/丁戊 引丙己',
      3: '六合天沖傷門 丙/丙 引乙', 7: '九天天柱驚門 庚/庚 引辛', 8: '太陰天任生門 辛/辛 引壬',
      1: '騰蛇天蓬休門 癸/癸 引丁', 6: '值符天心開門 己/己 引庚',
    });
  });

  it('伏吟引干再特例（2026/11/2 16:14 陰4局）', () => {
    const r = calculateQimen(2026, 11, 2, 16, 14, { chartType: '陰盤奇門' });
    expect(pick(r)[2]).toBe('值符天芮死門 庚乙/庚乙 引癸庚');
    expect(pick(r)[6]).toBe('九地天心開門 丙/丙 引己');
  });
});

describe('日干、時干落宮標示', () => {
  it('依天盤干找宮位（2026/6/26 23:25：日干壬在坤2、時干庚在艮8）', () => {
    const r = calculateQimen(2026, 6, 26, 23, 25, { chartType: '陰盤奇門' });
    expect(findStemPalace(r, r.siZhu.dayGan, r.siZhu.dayZhi)).toBe(2);
    expect(findStemPalace(r, r.siZhu.hourGan, r.siZhu.hourZhi)).toBe(8);
  });

  it('甲遁於旬首干下（甲申時找庚，庚寄中宮時隨天芮落坤2）', () => {
    const r = calculateQimen(2026, 11, 2, 16, 14, { chartType: '陰盤奇門' });
    expect(r.siZhu.hourGan + r.siZhu.hourZhi).toBe('甲申');
    expect(findStemPalace(r, '甲', '申')).toBe(2);
  });
});
