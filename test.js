import { calculateQimen } from './src/qimen.js'; const r = calculateQimen(2022, 6, 23, 19, 0, { chartType: '時家置閏' }); r.palaces.forEach(p => console.log('Pal ' + p.num + ' yinGan: ' + p.yinGan));
