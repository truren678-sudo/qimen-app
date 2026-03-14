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

    // 四害統整 (只列出門迫與空亡馬星，干的刑墓已經在天干地干列出)
    const harms = [];
    if (p.doorHarm === '迫') harms.push('門迫');
    if (result.kongWang && result.kongWang.includes(p.name)) harms.push('空亡');
    // 如果需要更精確的空亡地支判斷，可用元件中 getKongWangPals 的概念，此處簡化為顯示有就好
    // 若要呈現精確的馬星，需要額外傳入
    
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
    }

    return md;
}

// 匯出全盤資訊
export function exportFullChart(result) {
    const { chartType, solar, yinYang, juNum, xunShou, kongWang, yiMa, zhiFuXing, zhiShiMen, jieqiName, yuanName, gender, fuYinFanYin } = result;
    const isMingPan = chartType === '命盤';

    let md = `# 奇門遁甲排盤結果\n\n`;
    
    // 基本資訊區塊
    md += `- **起局**：${yinYang}${juNum}局\n`;
    md += `- **排盤系統**：${chartType}${isMingPan ? `（${gender}）` : ''}\n`;
    md += `- **公曆時間**：${solar.year}年${solar.month}月${solar.day}日 ${pad(solar.hour)}:${pad(solar.minute)}\n`;
    
    if (isMingPan) {
        const currentYear = new Date().getFullYear();
        const nominalAge = currentYear - solar.year + 1;
        let currentDaXianStr = '無';
        const currentPalace = result.palaces.find(p => p.daXian && nominalAge >= p.daXian.start && nominalAge <= p.daXian.end);
        if (currentPalace) {
            currentDaXianStr = `${currentPalace.daXian.start}~${currentPalace.daXian.end}歲 (${currentPalace.num}宮 ${currentPalace.name})`;
        }
        md += `- **當前虛歲**：${nominalAge} 歲\n`;
        md += `- **當前大限**：${currentDaXianStr}\n`;
    }

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

    // 照九宮順序 1~9 排列匯出
    for (let i = 1; i <= 9; i++) {
        md += exportPalace(result, i) + '\n';
    }

    return md;
}
