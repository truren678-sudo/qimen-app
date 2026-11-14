/**
 * 九宮格元件 v3 - 三欄式精準佈局
 */
import React, { useRef, useEffect, useState } from 'react';
import { exportPalace } from '../utils/exportMarkdown';
import { showToast } from '../utils/toast';
import { findStemPalace } from '../qimen';
import { BehaviorFengShuiModal } from './BehaviorFengShuiModal';

// 輔助尋找空亡與驛馬落宮
const DZ_PAL = {
    '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4,
    '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6
};

function getKongWangPals(kwStr) {
    if (!kwStr) return [];
    return Array.from(kwStr).map(c => DZ_PAL[c]).filter(Boolean);
}

// 與子奇門網站一致：刑、迫為紅色，墓為土黃色；刑墓同紅色並完整標示「刑墓」
const getHarmColor = (harm, defaultCls = 'text-gray-900') => {
    if (harm === '墓') return 'text-[#C0661A]';
    if (harm === '刑') return 'text-[#9B3DC4]';
    if (harm === '迫') return 'text-red-600';
    if (harm === '刑墓') return 'text-[#1E88D6]';
    return defaultCls;
};

// 一組天干（含寄干）：兩字並排時縮小並上緣對齊，四害小字標在各自下方
function StemGroup({ gan, harm, extra, extraHarm, labelPx, hangLabels }) {
    const stemPx = extra ? 17 : 20;
    const renderStem = (g, h) => (
        <div className="relative flex flex-col items-center leading-none">
            <span className={`font-bold ${getHarmColor(h)}`} style={{ fontSize: stemPx }}>{g}</span>
            {h && (
                <span
                    className={`font-bold whitespace-nowrap ${getHarmColor(h)} ${hangLabels ? 'absolute top-full mt-[2px]' : 'mt-[2px]'}`}
                    style={{ fontSize: labelPx }}
                >{h === '刑墓' ? '刑' : h}</span>
            )}
        </div>
    );
    return (
        <div className="flex items-start gap-[1px]">
            {renderStem(gan, harm)}
            {extra && renderStem(extra, extraHarm)}
        </div>
    );
}

const MARK_CLR = { '日': 'bg-[#4395CA]', '時': 'bg-orange-500' };

export function PalaceCell({ palace, isKong, isMa, isDayQimen, isMingPan, onCopy, onPalaceClick, controlZoom = 1, labelPx = 12, marks = [] }) {
    const { num, name, sym, shen, star, door, tianGan, diGan, tianGanExtra, diGanExtra, extraStar, doorHarm, tianGanHarm, diGanHarm, tianGanExtraHarm, diGanExtraHarm, daXian, personnel12 } = palace;
    const isCenter = num === 5;

    // 為了先符合版式，拔去固定的五行顏色，統一只以粗體大字呈現（除非是特例門迫等，後續再補算法）
    const doorCls = 'text-gray-900 font-bold';
    const handlePalaceKeyDown = event => {
        if (!onPalaceClick || event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPalaceClick(palace);
        }
    };

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
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-800 text-[14px] font-serif tracking-tighter leading-tight">
                        <span>{daXian.start}</span>
                        <span className="text-[14px] text-gray-400 rotate-90 leading-[0.5] py-1">~</span>
                        <span>{daXian.end}</span>
                    </div>
                )}
                {isMingPan && <span className="text-[24px] font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-800 to-indigo-800 opacity-60 font-serif">大 限</span>}

                {/* 單宮拷貝按鈕 */}
                {onCopy && (
                    <button type="button" data-no-capture onClick={(event) => { event.stopPropagation(); onCopy(); }} style={{ zoom: controlZoom }} className="absolute bottom-1 left-1 text-[14px] text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-200 border border-gray-300 rounded min-w-[32px] min-h-[32px] flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity" title="複製此宮位 MD" aria-label={`複製${name}${num}宮 Markdown`}>
                        📋
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            role={onPalaceClick ? 'button' : undefined}
            tabIndex={onPalaceClick ? 0 : undefined}
            aria-label={onPalaceClick ? `查看${name}${num}宮行為風水指導` : undefined}
            className={`relative bg-white border border-gray-300 min-h-[160px] p-2${onPalaceClick ? ' cursor-pointer hover:bg-amber-50/40 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#4395CA] transition-colors' : ''}`}
            onClick={onPalaceClick ? () => onPalaceClick(palace) : undefined}
            onKeyDown={handlePalaceKeyDown}
        >

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
                {marks.length > 0 && (
                    <div className="flex flex-col gap-[3px] mt-1.5">
                        {marks.map(m => (
                            <span key={m} title={`${m}干落宮`} className={`${MARK_CLR[m]} text-white font-bold rounded-[3px] w-[18px] h-[18px] flex items-center justify-center`} style={{ fontSize: Math.max(12, labelPx) }}>{m}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* 命盤專屬：大限區間 (顯示在宮內中左方) */}
            {daXian && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-purple-800 text-[14px] font-serif tracking-tighter leading-tight z-10">
                    <span>{daXian.start}</span>
                    <span className="text-[14px] text-gray-400 rotate-90 leading-[0.5] py-1">~</span>
                    <span>{daXian.end}</span>
                </div>
            )}

            {/* 右側列 (Top: 馬/空, Mid: 天干, Bot: 地干) */}
            <div className="absolute top-2 right-2 flex text-[14px] font-bold whitespace-nowrap gap-1">
                {isMa && <span className="text-[#4395CA]">馬</span>}
                {isKong && <span className="text-red-500">空◯</span>}
            </div>
            {/* 右中配置：天盤天干（四害小字懸掛於下方，天干本身與九星同高） */}
            <div className="absolute top-1/2 -translate-y-1/2 -mt-[6px] right-3">
                <StemGroup gan={tianGan} harm={tianGanHarm} extra={tianGanExtra} extraHarm={tianGanExtraHarm} labelPx={labelPx} hangLabels />
            </div>

            {/* 右下配置：地盤天干 */}
            <div className="absolute bottom-3 right-3">
                <StemGroup gan={diGan} harm={diGanHarm} extra={diGanExtra} extraHarm={diGanExtraHarm} labelPx={labelPx} />
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
                    {/* 無門迫時保留同高空行，讓各宮神、星、門的高度一致 */}
                    <span className={`font-bold ${getHarmColor(doorHarm)} mt-[2px]${doorHarm ? '' : ' invisible'}`} style={{ fontSize: labelPx }} aria-hidden={!doorHarm}>{doorHarm || '迫'}</span>
                </div>
            </div>

            {/* 命盤專屬：顯示在宮位底部的流年歲數 (已隱藏，僅在 md 中匯出) */}

            {/* 單宮拷貝按鈕 */}
            {onCopy && (
                <button type="button" data-no-capture onClick={(event) => { event.stopPropagation(); onCopy(); }} style={{ zoom: controlZoom }} className="absolute bottom-1 left-1 text-[14px] text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-200 border border-gray-300 rounded min-w-[32px] min-h-[32px] flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-20" title="複製此宮位 MD" aria-label={`複製${name}${num}宮 Markdown`}>
                    📋
                </button>
            )}
        </div>
    );
}

export function NineGrid({ result }) {
    const [selectedPalace, setSelectedPalace] = useState(null);
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const hasResult = Boolean(result?.palaces);

    useEffect(() => {
        const measure = () => {
            const w = containerRef.current?.offsetWidth || 0;
            setScale(w > 0 && w < 544 ? w / 544 : 1);
        };

        const observer = new ResizeObserver(measure);
        if (containerRef.current) observer.observe(containerRef.current);
        measure();
        return () => observer.disconnect();
    }, [hasResult]);

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
    const isShiJia = result.chartType === '時家置閏';

    // 盤面在手機上會整體縮小；小字依縮放比例放大，確保實際顯示不小於約 10px / 11px
    const labelPx = scale < 1 ? Math.max(12, Math.round(10 / scale)) : 12;
    const yinGanPx = scale < 1 ? Math.max(14, Math.round(11 / scale)) : 14;

    // 時盤標示日干、時干落宮（判讀時先定位「我」與「事」）
    const marksByPalace = {};
    if (result.chartType === '陰盤奇門' || isShiJia) {
        const { siZhu } = result;
        [['日', siZhu.dayGan, siZhu.dayZhi], ['時', siZhu.hourGan, siZhu.hourZhi]].forEach(([label, gan, zhi]) => {
            const num = findStemPalace(result, gan, zhi);
            if (num) (marksByPalace[num] ||= []).push(label);
        });
    }

    const getOuterYinGan = (palNum) => {
        if (isMingPan) return null;
        const p = result.palaces.find(x => x.num === palNum);
        if (!p || !p.yinGan) return null;
        return (
            <div className={`flex ${palNum === 9 || palNum === 1 ? 'flex-row gap-[2px]' : 'flex-col'} items-center justify-center text-gray-800 leading-tight font-medium`} style={{ fontSize: yinGanPx }}>
                {Array.from(p.yinGan).map((char, i) => (
                    <span key={i}>{char}</span>
                ))}
            </div>
        );
    };

    return (
    <>
        <div ref={containerRef} className="w-full">
            <div data-capture-bounds className="flex flex-col items-center mt-1 mb-4 md:mb-6 mx-auto" style={{ width: '540px', zoom: scale }}>
                {/* 盤面上方 */}
                {!isMingPan && (
                    <div className="flex items-center w-[540px] px-[42px] mb-1.5 text-[12px] text-gray-500 tracking-widest">
                         <div className="flex-1"></div>
                         <div className="flex-1 flex justify-center items-center gap-2">
                             {getOuterYinGan(9)}

                         </div>
                         <div className="flex-1"></div>
                    </div>
                )}

                <div className="flex items-stretch w-[540px] shrink-0">
                    {/* 盤面左方 */}
                    <div className={`${isMingPan ? 'w-[40px]' : 'w-[42px]'} shrink-0 flex relative`}>
                        <div className="w-[20px] flex items-center justify-center text-[12px] text-gray-500 tracking-[0.4em]" style={{ writingMode: 'vertical-rl' }}>

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
                                // 縮小時放大複製鈕以利點擊，但上限 1.375 倍，避免蓋到左下角旁的八門
                                controlZoom={scale < 1 ? Math.min(1 / scale, 1.375) : 1}
                                labelPx={labelPx}
                                marks={marksByPalace[p.num] || []}
                                onCopy={() => {
                                    const md = exportPalace(result, p.num);
                                    if (md) navigator.clipboard.writeText(md)
                                        .then(() => showToast(`已複製 ${p.name}${p.num}宮 Markdown`))
                                        .catch(() => showToast('複製失敗，請再試一次'));
                                }}
                                onPalaceClick={isShiJia ? (pal) => setSelectedPalace(pal) : undefined}
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

                        </div>
                    </div>
                </div>

                {/* 盤面下方 */}
                {!isMingPan && (
                    <div className="flex items-center w-[540px] px-[42px] mt-1.5 text-[12px] text-gray-500 tracking-widest">
                         <div className="flex-1"></div>
                         <div className="flex-1 flex justify-center items-center gap-2">
                             {getOuterYinGan(1)}

                         </div>
                         <div className="flex-1"></div>
                    </div>
                )}
            </div>
        </div>

        {/* 行為風水指導 Modal */}
        {selectedPalace && isShiJia && (
            <BehaviorFengShuiModal
                palace={selectedPalace}
                result={result}
                onClose={() => setSelectedPalace(null)}
            />
        )}
    </>
    );
}
