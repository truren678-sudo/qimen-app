import { describe, expect, it } from 'vitest';
import { calculateQimen } from '../src/qimen';
import { exportFullChart } from '../src/utils/exportMarkdown';

describe('全盤 MD 匯出', () => {
  it('包含農曆時間、天干地支與符頭（晚子時換日）', () => {
    const md = exportFullChart(calculateQimen(2026, 6, 26, 23, 25, { chartType: '陰盤奇門' }));
    expect(md).toContain('- **公曆時間**：2026年6月26日 23:25\n- **農曆時間**：2026年5月13日 23時\n- **天干地支**：丙午年 甲午月 壬申日 庚子時\n');
    expect(md).toContain('- **旬首**：甲午旬\n- **符頭**：辛\n');
  });

  it('閏月加註「閏」', () => {
    const md = exportFullChart(calculateQimen(2025, 7, 30, 10, 0, { chartType: '陰盤奇門' }));
    expect(md).toContain('- **農曆時間**：2025年閏6月6日 10時');
  });
});

describe('盤面圖片檔名', () => {
  it('包含排盤系統與西元時間', async () => {
    const { buildChartImageName } = await import('../src/utils/saveChartImage');
    const r = calculateQimen(2026, 6, 26, 23, 25, { chartType: '陰盤奇門' });
    expect(buildChartImageName(r)).toBe('奇門_陰盤奇門_2026-06-26_2325.png');
  });

  it('節氣顯示整段區間（對照 TZCHIMEN 2011/05/12 22:29）', () => {
    const md = exportFullChart(calculateQimen(2011, 5, 12, 22, 29, { chartType: '陰盤奇門' }));
    expect(md).toContain('- **節氣**：立夏 2011.05.06 04:23 ～ 小滿 2011.05.21 17:21\n');
    expect(md).not.toContain('**定局**');
  });

  it('置閏盤另列定局節氣與元', () => {
    const md = exportFullChart(calculateQimen(2011, 5, 12, 22, 29, { chartType: '時家置閏' }));
    expect(md).toMatch(/- \*\*定局\*\*：.+ · [上中下]元\n/);
  });
});
