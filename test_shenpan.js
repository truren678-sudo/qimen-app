import { calculateQimen } from './src/qimen.js';

const res = calculateQimen(1996, 6, 25, 16, 25, { chartType: '命盤', gender: '男' });
console.log('--- 1996/6/25 16:25 ---');
res.palaces.forEach(p => {
    console.log(`${p.name}${p.num}: 神=${p.shen}, 星=${p.star}, 門=${p.door}`);
});
