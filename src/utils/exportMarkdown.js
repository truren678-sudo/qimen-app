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
        // 命主八字
        md += `- **命主八字**：${result.siZhu.yearGan}${result.siZhu.yearZhi}年 ${result.siZhu.monthGan}${result.siZhu.monthZhi}月 ${result.siZhu.dayGan}${result.siZhu.dayZhi}日 ${result.siZhu.hourGan}${result.siZhu.hourZhi}時\n`;
        md += `- **當前虛歲**：${nominalAge} 歲\n`;
        md += `- **當前大限**：${currentDaXianStr}\n`;

        // 五行對照表
        const WUXING_MAP = { 1:'水', 2:'土', 3:'木', 4:'木', 5:'土', 6:'金', 7:'金', 8:'土', 9:'火' };
        
        // 命宮(時支宮)：含有「命宮」的人事宮
        const mgPalace = result.palaces.find(p => p.personnel12 && p.personnel12.some(x => x.name === '命宮'));
        const mgWuXing = mgPalace ? WUXING_MAP[mgPalace.num] : '未知';
        
        // 身宮(日干宮)：天盤干等於日干的宮位
        const sgPalace = result.palaces.find(p => p.tianGan === result.siZhu.dayGan || p.tianGanExtra === result.siZhu.dayGan);
        const sgWuXing = sgPalace ? WUXING_MAP[sgPalace.num] : '未知';
        
        // 平台宮(時干宮)：天盤干等於時干的宮位 (若為甲，需轉為旬首干)
        const XUN_HEAD_MAP = { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' };
        const realHourGan = result.siZhu.hourGan === '甲' ? (XUN_HEAD_MAP[result.xunShou.replace('旬', '')] || '甲') : result.siZhu.hourGan;
        const ptPalace = result.palaces.find(p => p.tianGan === realHourGan || p.tianGanExtra === realHourGan);
        const ptWuXing = ptPalace ? WUXING_MAP[ptPalace.num] : '未知';

        // 整理輸出格式，例如: 命宮(時支宮)：1宮 坎 (五行:水，宮內天干:戊) 
        // 根據使用者說的 "五行(甲乙丙丁戊己庚辛壬癸)"
        const getGanStr = (pal) => pal ? (pal.tianGan || pal.diGan || '無') : '無';
        
        md += `- **命宮 (時支宮)**：${mgPalace ? `${mgPalace.num}宮 ${mgPalace.name} (天干: ${getGanStr(mgPalace)}, 五行: ${mgWuXing})` : '未知'}\n`;
        md += `- **身宮 (日干落宮)**：${sgPalace ? `${sgPalace.num}宮 ${sgPalace.name} (天干: ${getGanStr(sgPalace)}, 五行: ${sgWuXing})` : '未知'}\n`;
        md += `- **平台宮 (時干落宮)**：${ptPalace ? `${ptPalace.num}宮 ${ptPalace.name} (天干: ${getGanStr(ptPalace)}, 五行: ${ptWuXing})` : '未知'}\n`;
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
