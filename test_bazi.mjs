import { Solar } from 'lunar-javascript';

const solar = Solar.fromYmdHms(2026, 3, 7, 23, 43, 0);
const isLateZiShi = solar.getHour() >= 23;
const lunarBase = isLateZiShi ? solar.next(1).getLunar() : solar.getLunar();

console.log('isLateZiShi:', isLateZiShi);
console.log('lunarBase.getDay():', lunarBase.getDay());
console.log('lunarBase.getMonth():', lunarBase.getMonth());

// DI_ZHI
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 年支：午 = 6 (0-indexed) → index+1 = 7
const yearZhiIndex = DI_ZHI.indexOf('午') + 1; // 7
// 農曆月：正月=1
const lunarMonth = Math.abs(lunarBase.getMonth()); // 1
// 農曆日：隔天=二十=20
const lunarDay = lunarBase.getDay();
// 時支：子=0 → index+1 = 1
const hourZhiIndex = DI_ZHI.indexOf('子') + 1; // 1

const sum = yearZhiIndex + lunarMonth + lunarDay + hourZhiIndex;
let juNum = sum % 9;
if (juNum === 0) juNum = 9;

console.log(`年支(${yearZhiIndex})+農月(${lunarMonth})+農日(${lunarDay})+時支(${hourZhiIndex}) = ${sum}`);
console.log(`局數 = ${sum} % 9 = ${juNum}  (預期: 2)`);
