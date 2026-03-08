const { Solar } = require('lunar-javascript');
const solar = Solar.fromYmdHms(2026, 3, 7, 23, 43, 0);
const lunar = solar.getLunar();
const bazi = lunar.getEightChar();
console.log('Day:', lunar.getDay(), 'Month:', lunar.getMonth());
console.log('GanZhi:', bazi.getYear(), bazi.getMonth(), bazi.getDay(), bazi.getTime());
