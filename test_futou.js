const { Solar, Lunar } = require('lunar-javascript');

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function gzIdx(gan, zhi) {
    const g = TIAN_GAN.indexOf(gan), z = DI_ZHI.indexOf(zhi);
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    return 0;
}

// 取得符頭資訊
function getFutou(solar) {
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    const dayIdx = gzIdx(bazi.getDayGan(), bazi.getDayZhi());

    // 符頭是每 5 天一組的首日（天干為甲或己）
    const futouIdx = dayIdx - (dayIdx % 5);
    const yuan = Math.floor(futouIdx / 5) % 3; // 0:上元, 1:中元, 2:下元

    // 符頭日期的 Date Object (往前推 dayIdx % 5 天)
    const d = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    d.setDate(d.getDate() - (dayIdx % 5));

    return {
        futouIdx,
        yuan,
        date: d
    };
}

function test() {
    const s = Solar.fromYmdHms(2025, 7, 25, 20, 23, 0);
    const futou = getFutou(s);
    console.log('2025-07-25');
    console.log('Futou yuan:', ['上元', '中元', '下元'][futou.yuan]);
    console.log('Futou date:', futou.date.toISOString().substring(0, 10));
}
test();
