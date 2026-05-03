// 負責將排盤結果轉換為 Markdown 字串的共用函數

function pad(n) { return String(n).padStart(2, '0'); }

// 匯出單宮資訊
export function exportPalace(result, palaceNum) {
    const p = result.palaces.find(x => x.num === palaceNum);
    if (!p) return '';

    const isMingPan = result.chartType === '命盤';
    const isYinPan = result.chartType === '陰盤奇門';

    let md = `### 【${p.num}宮 ${p.name}】\n`;
    
    // 中宮特例
    if (p.num === 5 && !result.isDayQimen) {
        if (isMingPan) {
            md += `- **大限**：${p.daXian ? `${p.daXian.start}~${p.daXian.end}` : '無'}\n`;
            md += `- **備註**：天禽星(寄坤二宮)\n`;
        } else {
            md += `- **天干**：${p.tianGan || ''}\n`;
            md += `- **星**：${p.star || ''}\n`;
            md += `- **備註**：天禽星(寄坤二宮)\n`;
        }
        return md;
    }

    // 神、星、門
    const shenStarDoor = [p.shen, p.star, p.door].filter(Boolean).join('、');
    md += `- **神星門**：${shenStarDoor || '無'}\n`;

    // 天干地干 (處理包含額外干的情形)
    const renderGan = (gan, extraGan, harm, extraHarm) => {
        let str = gan;
        if (harm) str += ` (${harm})`;
        if (extraGan) {
            str += ` / ${extraGan}`;
            if (extraHarm) str += ` (${extraHarm})`;
        }
        return str || '無';
    };

    md += `- **天干**：${renderGan(p.tianGan, p.tianGanExtra, p.tianGanHarm, p.tianGanExtraHarm)}\n`;
    md += `- **地干**：${renderGan(p.diGan, p.diGanExtra, p.diGanHarm, p.diGanExtraHarm)}\n`;

    // 引干 (陰盤特有或有特別標示的)
    if (p.yinGan) {
        md += `- **引干**：${p.yinGan}\n`;
    }

    // 四害與特殊神煞統整 (門迫、空亡、驛馬)
    const harms = [];
    if (p.doorHarm === '迫') harms.push('門迫');
    
    // 定義地支對應宮位
    const DZ_PAL = {
        '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4,
        '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6
    };

    // 判斷空亡
    if (result.kongWang) {
        const kwPals = Array.from(result.kongWang).map(c => DZ_PAL[c]).filter(Boolean);
        if (kwPals.includes(p.num)) {
            harms.push('空亡');
        }
    }

    // 判斷驛馬
    if (result.yiMa) {
        const maPal = DZ_PAL[result.yiMa];
        if (maPal === p.num) {
            harms.push('驛馬');
        }
    }
    
    if (harms.length > 0) {
        md += `- **其他資訊**：${harms.join('、')}\n`;
    }

    // 命盤特有
    if (isMingPan) {
        if (p.personnel12 && p.personnel12.length > 0) {
            md += `- **人事宮**：${p.personnel12.map(x => x.name).join('、')}\n`;
        }
        if (p.daXian) {
            md += `- **大限**：${p.daXian.start} ~ ${p.daXian.end} 歲\n`;
        }
        if (p.liuNianAges && p.liuNianAges.length > 0) {
            md += `- **流年歲數 (1~70歲)**：${p.liuNianAges.join('、')} 歲\n`;
        }
    }

    return md;
}

// 匯出全盤資訊
export function exportFullChart(result) {
    const { chartType, solar, yinYang, juNum, xunShou, kongWang, yiMa, zhiFuXing, zhiShiMen, jieqiName, yuanName, gender, fuYinFanYin } = result;
    const isMingPan = chartType === '命盤';

    let md = '';

    if (isMingPan) {
        md += `# 命主：奇門命盤（${gender}命）\n`;
        md += `- 出生：${solar.year}年${pad(solar.month)}月${pad(solar.day)}日 ${result.siZhu.hourZhi}時\n`;
        md += `- 八字：${result.siZhu.yearGan}${result.siZhu.yearZhi} ${result.siZhu.monthGan}${result.siZhu.monthZhi} ${result.siZhu.dayGan}${result.siZhu.dayZhi} ${result.siZhu.hourGan}${result.siZhu.hourZhi}\n`;
        md += `- 局數：${yinYang}${juNum}局\n`;

        const WUXING_MAP = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };
        const PAL_NAME = { 1: '坎', 8: '艮', 3: '震', 4: '巽', 9: '離', 2: '坤', 7: '兌', 6: '乾' };
        const DZ_PAL = { '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4, '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6 };

        // 身宮
        const sgPalace = result.palaces.find(p => p.tianGan === result.siZhu.dayGan || p.tianGanExtra === result.siZhu.dayGan);
        const sgStr = sgPalace ? `（身宮：${PAL_NAME[sgPalace.num]}${sgPalace.num}宮）` : '';
        md += `- 日主天干：${result.siZhu.dayGan}${sgStr}\n`;

        // 空亡
        let kwStr = '無';
        if (kongWang) {
            const kwPals = Array.from(kongWang).map(c => DZ_PAL[c]).filter(Boolean);
            const uniqKw = [...new Set(kwPals)];
            kwStr = uniqKw.map(n => `${PAL_NAME[n]}${n}宮`).join('、');
        }
        md += `- 空亡：${kwStr}\n`;

        // 馬星
        let maStr = '無';
        if (yiMa) {
            const maPal = DZ_PAL[yiMa];
            maStr = `${PAL_NAME[maPal]}${maPal}宮`;
        }
        md += `- 馬星：${maStr}\n`;

        // 目前大限
        const currentYear = new Date().getFullYear();
        const nominalAge = currentYear - solar.year + 1;
        const currentPalace = result.palaces.find(p => p.daXian && nominalAge >= p.daXian.start && nominalAge <= p.daXian.end);
        
        // 取得大限順序
        const sortedPals = [...result.palaces].filter(p => p.daXian).sort((a, b) => a.daXian.start - b.daXian.start);
        let daXianText = '無';
        let currentLimitIndex = -1;
        if (currentPalace) {
            currentLimitIndex = sortedPals.findIndex(p => p.num === currentPalace.num);
            daXianText = `${nominalAge}歲，第${currentLimitIndex + 1}大限（${PAL_NAME[currentPalace.num]}${currentPalace.num}宮，${currentPalace.daXian.start}～${currentPalace.daXian.end}歲）`;
        }
        md += `- 目前：${daXianText}\n\n`;

        // 各宮符號 Table
        md += `## 各宮符號\n\n`;
        md += `| 宮位 | 人事宮 | 八神 | 九星 | 八門 | 天盤干 | 地盤干 | 四害 | 大限 |\n`;
        md += `|------|--------|------|------|------|--------|--------|------|------|\n`;

        const PERSONNEL_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];
        const seenPalaces = new Set();
        
        // 顯示名稱統一加宮
        const withGong = (name) => name.endsWith('宮') ? name : name + '宮';

        // 尋找人事宮對應的物理宮位
        const findPalaceForPersonnel = (pName) => {
            const searchName = pName.replace('宮', '');
            return result.palaces.find(p => p.personnel12 && p.personnel12.some(x => x.name.replace('宮', '') === searchName));
        };

        // 判斷某宮是否為當前大限
        const isCurrentDaXian = (pal) => currentPalace && currentPalace.num === pal.num;

        PERSONNEL_ORDER.forEach((pNameFull) => {
            const pName = withGong(pNameFull);
            const pal = findPalaceForPersonnel(pName);
            if (!pal) return;

            const palStr = `${PAL_NAME[pal.num]}${pal.num}宮（${WUXING_MAP[pal.num]}）`;
            if (seenPalaces.has(pal.num)) {
                // 重複宮位（同一物理宮有多個人事宮）
                const firstPersonnel = pal.personnel12[0]?.name;
                const refName = withGong(firstPersonnel);
                const daXianStr = pal.daXian ? `${pal.daXian.start}歲` : '—';
                md += `| ${PAL_NAME[pal.num]}${pal.num}宮 | ${pName} | （同${refName}）| — | — | — | — | — | ${daXianStr} |\n`;
            } else {
                seenPalaces.add(pal.num);
                const harms = [];
                if (pal.doorHarm === '迫') harms.push('門迫');
                if (pal.tianGanHarm) harms.push(pal.tianGanHarm);
                if (pal.diGanHarm) harms.push(pal.diGanHarm);
                if (kwStr.includes(`${pal.num}宮`)) harms.push('空亡');
                if (maStr.includes(`${pal.num}宮`)) harms.push('驛馬');
                const harmStr = harms.length > 0 ? harms.join('、') : '無';
                
                const tG = pal.tianGanExtra ? `${pal.tianGan}/${pal.tianGanExtra}` : pal.tianGan;
                const dG = pal.diGanExtra ? `${pal.diGan}/${pal.diGanExtra}` : pal.diGan;
                
                const daXianStr = pal.daXian ? `${pal.daXian.start}歲${isCurrentDaXian(pal) ? '▶' : ''}` : '—';
                
                md += `| ${palStr} | ${pName} | ${pal.shen || '—'} | ${pal.star || '—'} | ${pal.door || '—'} | ${tG || '—'} | ${dG || '—'} | ${harmStr} | ${daXianStr} |\n`;
            }
        });

        md += `\n## 大限排列（${gender}命${result.isYin ? '陰遁逆數' : '陽遁順數'}）\n`;
        sortedPals.forEach((p, idx) => {
            const isCurrent = currentPalace && currentPalace.num === p.num;
            const palStr = `${PAL_NAME[p.num]}${p.num}宮（${WUXING_MAP[p.num]}）`;
            md += `- 第${idx + 1}限：${p.daXian.start}～${p.daXian.end}歲，${palStr}${isCurrent ? ' ▶ 當前' : ''}\n`;
        });

        if (currentPalace && currentLimitIndex !== -1) {
            md += `\n## 流年地支對照（第${currentLimitIndex + 1}大限 ${currentPalace.daXian.start}～${currentPalace.daXian.end}歲）\n`;
            const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
            const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
            const bYearZhiIdx = DI_ZHI.indexOf(result.siZhu.yearZhi);
            
            for (let age = currentPalace.daXian.start; age <= currentPalace.daXian.end; age++) {
                const yearNum = solar.year + age - 1;
                const yZhiIdx = (bYearZhiIdx + age - 1) % 12;
                const yZhi = DI_ZHI[yZhiIdx];
                const pNum = DZ_PAL[yZhi];
                const pName = PAL_NAME[pNum];
                
                let pPalaceStr = '';
                const pPalaceObj = result.palaces.find(x => x.num === pNum);
                if (pPalaceObj && pPalaceObj.personnel12 && pPalaceObj.personnel12.length > 0) {
                    const firstPer = pPalaceObj.personnel12[0].name;
                    pPalaceStr = firstPer.endsWith('宮') ? firstPer : firstPer + '宮';
                }
                
                md += `- ${age}歲（${yearNum}）→ ${pPalaceStr}（${pName}${pNum}）\n`;
            }
        }
        
    } else {
        // 標準排盤匯出
        md += `# 奇門遁甲排盤結果\n\n`;
        md += `- **起局**：${yinYang}${juNum}局\n`;
        md += `- **排盤系統**：${chartType}\n`;
        md += `- **公曆時間**：${solar.year}年${solar.month}月${solar.day}日 ${pad(solar.hour)}:${pad(solar.minute)}\n`;
        
        if (jieqiName && yuanName) {
            md += `- **節氣**：${jieqiName} · ${yuanName}\n`;
        }

        md += `- **旬首**：${xunShou}\n`;
        md += `- **空亡**：${kongWang || '無'}\n`;
        md += `- **驛馬**：${yiMa || '無'}\n`;
        
        if (zhiFuXing && zhiShiMen) {
            md += `- **值符**：${zhiFuXing} / **值使**：${zhiShiMen}\n`;
        }
        
        if (fuYinFanYin) {
            md += `- **格局**：${fuYinFanYin}\n`;
        }

        md += `\n## 九宮格詳解\n\n`;

        for (let i = 1; i <= 9; i++) {
            md += exportPalace(result, i) + '\n';
        }
    }

    return md;
}
