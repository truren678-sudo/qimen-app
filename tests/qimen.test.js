import { describe, it, expect } from 'vitest';
import { calculateQimen } from '../src/qimen';

describe('Qimen Calculator', () => {
  it('should calculate correct Qimen Dunjia chart values', () => {
    // 測試已知盤面的基本計算
    const result = calculateQimen(1993, 7, 25, 18, 50, { chartType: '時家置閏' });
    
    // 1993/7/25 18:50 (大暑後，符合小暑下元)
    expect(result).toBeDefined();
    expect(result.jieqiName).toBe('小暑');
    expect(result.juNum).toBe(5); // 陰遁5局
    expect(result.isYin).toBe(true);
  });
});
