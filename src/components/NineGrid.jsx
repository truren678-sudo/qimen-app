/**
 * 九宮格元件 v3 - 三欄式精準佈局
 */
import React, { useRef, useEffect, useState } from 'react';
import { exportPalace } from '../utils/exportMarkdown';

// 色彩配置：符合參考圖主要黑/灰，部分紅/綠
const DOOR_CLR = {
    '杜門': 'text-red-500 font-bold',
    '景門': 'text-red-500 font-bold',
    '休門': 'text-gray-800 font-bold',
    '生門': 'text-green-600 font-bold', // Image showed green
    '傷門': 'text-orange-600 font-bold', // Image showed orange
    '開門': 'text-green-600 font-bold',
    '死門': 'text-gray-500 font-bold',
    '驚門': 'text-orange-600 font-bold',
};

// 輔助尋找空亡與驛馬落宮
const DZ_PAL = {
    '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4,
    '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6
};

function getKongWangPals(kwStr) {
    if (!kwStr) return [];
    return Array.from(kwStr).map(c => DZ_PAL[c]).filter(Boolean);
}

const getHarmColor = (harm, defaultCls = 'text-gray-900') => {
    if (harm === '迫') return 'text-red-600';
    if (harm === '刑') return 'text-purple-600'; // 紫色
    if (harm === '墓') return 'text-[#B8860B]'; // 土黃色
    if (harm === '刑墓') return 'text-blue-600'; // 藍色
    return defaultCls;
};

const getHarmText = (harm) => {
    if (harm === '刑墓') return '刑';
    return harm;
};

export function PalaceCell({ palace, isKong, isMa, isDayQimen, isMingPan, onCopy }) {
    const { num, name, sym, shen, star, door, tianGan, diGan, tianGanExtra, diGanExtra, extraStar, doorHarm, tianGanHarm, diGanHarm, tianGanExtraHarm, diGanExtraHarm, daXian, personnel12 } = palace;
    const isCenter = num === 5;

    // 為了先符合版式，拔去固定的五行顏色，統一只以粗體大字呈現（除非是特例門迫等，後續再補算法）
    const doorCls = 'text-gray-900 font-bold';

    if (isCenter) {
        if (isDayQimen) {
            const starCls = (star === '太乙' || star === '天乙') ? 'text-red-500' : 'text-gray-900';
            return (
                <div className="relative bg-white border border-gray-300 min-h-[160px] p-2 flex flex-col items-center justify-center">
                    <span className="text-[15px] text-gray-700 tracking-widest leading-none mb-4">{tianGan}</span>
                    <span className={`text-[20px] font-bold ${starCls} tracking-widest leading-none`}>{star}</span>
                </div>
            );
        }

        return (
            <div className="relative bg-white border border-gray-300 min-h-[160px] p-2 flex flex-col items-center justify-center">
                <span className="absolute top-2 left-2 text-[15px] font-bold text-gray-700">5</span>
                {daXian && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-800 text-[14px] font-serif tracking-tighter leading-tight mt-1">
                        <span>{daXian.start}</span>
                        <span className="text-[14px] text-gray-400 rotate-90 leading-[0.5] py-2">~</span>
                        <span>{daXian.end}</span>
                    </div>
                )}
                {isMingPan && <span className="text-[24px] font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-800 to-indigo-800 opacity-60 font-serif">大 限</span>}
                <span className="absolute bottom-2 text-[11px] text-gray-400">天禽(寄坤二)</span>

                {/* 單宮拷貝按鈕 */}
                {onCopy && (
                    <button onClick={onCopy} className="absolute bottom-1 right-1 text-[10px] text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-200 border border-gray-200 rounded px-1 min-w-[16px] min-h-[16px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity" title="複製此宮位 MD">
                        📋
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative bg-white border border-gray-300 min-h-[160px] p-2">

            {/* 命盤專屬：顯示在宮位外圍的人事十二宮 */}
            {personnel12 && personnel12.map((p, idx) => {
                let posClass = '';
                let style = {};
                switch (p.pos) {
                    case 'top': posClass = '-top-8 left-1/2 -translate-x-1/2'; break;
                    case 'bottom': posClass = '-bottom-8 left-1/2 -translate-x-1/2'; break;
                    case 'left': posClass = '-left-8 top-1/2 -translate-y-1/2'; style.writingMode = 'vertical-rl'; break;
                    case 'right': posClass = '-right-8 top-1/2 -translate-y-1/2'; style.writingMode = 'vertical-rl'; break;
                }
                return (
                    <div key={idx} className={`absolute text-[#4b4e6d] font-bold text-[15px] tracking-[0.2em] whitespace-nowrap z-10 ${posClass}`} style={style}>
                        {p.name}
                    </div>
                );
            })}

            {/* 左側列 (Top: 宮位符號+數字, Bot: 引干「莏内」) */}
            <div className="absolute top-2 left-2 flex flex-col items-start leading-none z-10">
                <span className="font-bold text-[18px] text-gray-900 tracking-tighter">{sym}{num}</span>
                <span className="text-[15px] font-bold text-gray-900 tracking-widest mt-1">{name}</span>
            </div>

            {/* 命盤專屬：大限區間 (顯示在宮內中左方) */}
            {daXian && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-800 text-[14px] font-serif tracking-tighter leading-tight mt-1 z-10">
                    <span>{daXian.start}</span>
                    <span className="text-[14px] text-gray-400 rotate-90 leading-[0.5] py-2">~</span>
                    <span>{daXian.end}</span>
                </div>
            )}

            {/* 右側列 (Top: 馬/空, Mid: 天干, Bot: 地干) */}
            <div className="absolute top-2 right-2 flex text-[14px] font-bold whitespace-nowrap gap-1">
                {isMa && <span className="text-[#4395CA]">馬</span>}
                {isKong && <span className="text-red-500">空◯</span>}
            </div>
            {/* 右中配置：天盤天干 */}
            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col items-center">
                <div className="flex items-baseline gap-0.5">
                    <div className="flex flex-col items-center leading-none">
                        <span className={`text-[20px] font-bold ${getHarmColor(tianGanHarm)}`}>{tianGan}</span>
                        {tianGanHarm && <span className={`text-[12px] font-bold ${getHarmColor(tianGanHarm)} mt-[2px]`}>{getHarmText(tianGanHarm)}</span>}
                    </div>
                    {tianGanExtra && (
                        <div className="flex flex-col items-center leading-none">
                            <span className={`text-[20px] font-bold ${getHarmColor(tianGanExtraHarm)}`}>{tianGanExtra}</span>
                            {tianGanExtraHarm && <span className={`text-[12px] font-bold ${getHarmColor(tianGanExtraHarm)} mt-[2px]`}>{getHarmText(tianGanExtraHarm)}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* 右下配置：地盤天干 */}
            <div className="absolute bottom-3 right-3 flex flex-col items-center">
                <div className="flex items-baseline gap-0.5">
                    <div className="flex flex-col items-center leading-none">
                        <span className={`text-[20px] font-bold ${getHarmColor(diGanHarm)}`}>{diGan}</span>
                        {diGanHarm && <span className={`text-[12px] font-bold ${getHarmColor(diGanHarm)} mt-[2px]`}>{getHarmText(diGanHarm)}</span>}
                    </div>
                    {diGanExtra && (
                        <div className="flex flex-col items-center leading-none">
                            <span className={`text-[20px] font-bold ${getHarmColor(diGanExtraHarm)}`}>{diGanExtra}</span>
                            {diGanExtraHarm && <span className={`text-[12px] font-bold ${getHarmColor(diGanExtraHarm)} mt-[2px]`}>{getHarmText(diGanExtraHarm)}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* 中間主欄列 (神、星、門) */}
            <div className="flex flex-col items-center justify-between h-full pt-0.5 pb-1">
                <span className="text-[20px] font-bold text-gray-900 tracking-widest leading-none mt-1">{shen}</span>

                <div className="relative flex items-center justify-center leading-none flex-wrap gap-x-1">
                    <span className="text-[20px] font-bold text-gray-900 tracking-widest">{star}</span>
                    {extraStar && <span className="text-[11px] text-gray-500 whitespace-nowrap">{extraStar}</span>}
                </div>

                <div className="flex flex-col items-center leading-none">
                    <span className={`text-[20px] tracking-widest ${getHarmColor(doorHarm, doorCls)}`}>{door}</span>
                    {doorHarm && <span className={`text-[12px] font-bold ${getHarmColor(doorHarm)} mt-[2px]`}>{getHarmText(doorHarm)}</span>}
                </div>
            </div>

            {/* 單宮拷貝按鈕 */}
            {onCopy && (
                <button onClick={onCopy} className="absolute bottom-1 right-1 text-[10px] text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-200 border border-gray-200 rounded px-1 min-w-[16px] min-h-[16px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity z-20" title="複製此宮位 MD">
                    📋
                </button>
            )}
        </div>
    );
}

export function NineGrid({ result }) {
    if (!result || !result.palaces) {
        return (
            <div className="flex items-center justify-center w-[500px] h-[500px] bg-white text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-sm">
                請在左側點擊「開始排盤」
            </div>
        );
    }

    const kwPals = getKongWangPals(result.kongWang);
    const maPal = DZ_PAL[result.yiMa];

    const isMingPan = result.chartType === '命盤';
    const isYinPan = result.chartType === '陰盤奇門';

    const getOuterYinGan = (palNum) => {
        if (!isYinPan) return null;
        const p = result.palaces.find(x => x.num === palNum);
        if (!p || !p.yinGan) return null;
        return (
            <div className="flex flex-col items-center justify-center text-[14px] text-gray-800 leading-tight font-medium">
                {Array.from(p.yinGan).map((char, i) => (
                    <span key={i}>{char}</span>
                ))}
            </div>
        );
    };

    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const measure = () => {
            const w = containerRef.current?.offsetWidth || 0;
            if (w > 0 && w < 544) {
                setScale(w / 544);
            } else {
                setScale(1);
            }
        };

        const observer = new ResizeObserver(measure);
        if (containerRef.current) observer.observe(containerRef.current);
        measure();
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full">
            <div className="flex flex-col items-center mt-6 mb-6 mx-auto" style={{ width: '540px', zoom: scale }}>
                {/* 盤面上方 */}
                {!isMingPan && (
                    <div className="flex items-center w-[540px] px-[42px] mb-1.5 text-[12px] text-gray-500 tracking-widest">
                         <div className="flex-1"></div>
                         <div className="flex-1 flex justify-center items-center gap-2">
                             {getOuterYinGan(9)}
                             <span>▲ 南（巳 · 離 · 午）</span>
                         </div>
                         <div className="flex-1"></div>
                    </div>
                )}

                <div className="flex items-stretch w-[540px] shrink-0">
                    {/* 盤面左方 */}
                    <div className={`${isMingPan ? 'w-[40px]' : 'w-[42px]'} shrink-0 flex relative`}>
                        <div className="w-[20px] flex items-center justify-center text-[12px] text-gray-500 tracking-[0.4em]" style={{ writingMode: 'vertical-rl' }}>
                            {!isMingPan && '東（卯）'}
                        </div>
                        <div className="flex-1 flex flex-col py-1">
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(4)}</div>
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(3)}</div>
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(8)}</div>
                        </div>
                    </div>

                    {/* 正九宮格 */}
                    <div className="grid grid-cols-3 flex-1 border border-gray-400 shadow-sm relative">
                        {result.palaces.map(p => (
                            <PalaceCell
                                key={p.num}
                                palace={p}
                                isKong={kwPals.includes(p.num)}
                                isMa={maPal === p.num}
                                isDayQimen={result.isDayQimen}
                                isMingPan={isMingPan}
                                onCopy={() => {
                                    const md = exportPalace(result, p.num);
                                    if(md) navigator.clipboard.writeText(md).then(() => alert(`已複製 ${p.name}宮 (\`${p.num}\`) 的 Markdown！`));
                                }}
                            />
                        ))}
                    </div>

                    {/* 盤面右方 */}
                    <div className={`${isMingPan ? 'w-[40px]' : 'w-[42px]'} shrink-0 flex relative`}>
                        <div className="flex-1 flex flex-col py-1">
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(2)}</div>
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(7)}</div>
                            <div className="flex-1 flex items-center justify-center">{getOuterYinGan(6)}</div>
                        </div>
                        <div className="w-[20px] flex items-center justify-center text-[12px] text-gray-500 tracking-[0.4em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            {!isMingPan && '西（酉）'}
                        </div>
                    </div>
                </div>

                {/* 盤面下方 */}
                {!isMingPan && (
                    <div className="flex items-center w-[540px] px-[42px] mt-1.5 text-[12px] text-gray-500 tracking-widest">
                         <div className="flex-1"></div>
                         <div className="flex-1 flex justify-center items-center gap-2">
                             {getOuterYinGan(1)}
                             <span>▼ 北（亥 · 坎 · 子）</span>
                         </div>
                         <div className="flex-1"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
