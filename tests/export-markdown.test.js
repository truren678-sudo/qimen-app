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
