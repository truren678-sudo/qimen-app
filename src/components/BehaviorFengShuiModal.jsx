/**
 * 行為風水指導 Modal
 */
import React from 'react';
import { generateBehaviorGuide } from '../utils/behaviorFengShui';
import { BA_SHEN_DATA, JIU_XING_DATA, BA_MEN_DATA, TIAN_GAN_DATA } from '../utils/behaviorFengShuiData';

export function BehaviorFengShuiModal({ palace, result, onClose }) {
    if (!palace || !result) return null;

    const guide = generateBehaviorGuide(palace, result);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* 頂部漸層條 */}
                <div className="h-2 rounded-t-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

                {/* 標題列 */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🌀</span>
                        行為風水指導
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-5 pb-5">
                    {/* 非吉門 */}
                    {guide.status === 'no_good_door' && (
                        <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <span className="text-3xl block mb-2">🚫</span>
                            <p className="text-gray-500 text-sm">{guide.message}</p>
                        </div>
                    )}

                    {/* 凶格警告 */}
                    {guide.status === 'blocked' && (
                        <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">⚠️</span>
                                <span className="text-red-700 font-bold text-sm">{guide.message}</span>
                            </div>
                            <ul className="ml-8 text-sm text-red-600 list-disc space-y-1">
                                {guide.blockReasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 正常指導卡 */}
                    {guide.status === 'ok' && (
                        <div className="mt-2 space-y-3">
                            {/* 宮位摘要 */}
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-amber-700">{guide.palaceName}</div>
                                    <div className="text-xs text-amber-600">{guide.palaceWuxing}</div>
                                </div>
                                <div className="flex-1 text-xs text-gray-600 space-y-0.5">
                                    <div>八神：<b>{guide.symbols.shen}</b>　九星：<b>{guide.symbols.star}</b>　八門：<b>{guide.symbols.door}</b></div>
                                    <div>天盤干：<b>{guide.symbols.tianGan}</b>　地盤干：<b>{guide.symbols.diGan}</b></div>
                                </div>
                            </div>

                            {/* 適用時間 & 方位 */}
                            <div className="grid grid-cols-2 gap-2">
                                <InfoCard icon="🕐" label="適用時間" value={`${guide.hourZhi}時 ${guide.timeRange}`} />
                                <InfoCard icon="🧭" label="適用方位" value={guide.direction} />
                            </div>

                            {/* 核心動作 */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-lg">⚡</span>
                                    <span className="text-sm font-bold text-blue-800">核心動作（以天干為主）</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {guide.coreAction.primaryGan && (
                                        <div>
                                            <span className="inline-block px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold mr-1.5">
                                                {guide.coreAction.primaryGan}
                                            </span>
                                            <span className="text-gray-700">
                                                {guide.coreAction.primaryActions || guide.coreAction.primaryTraits}
                                            </span>
                                            {guide.coreAction.primaryItems && (
                                                <div className="ml-7 mt-0.5 text-xs text-gray-500">
                                                    物品：{guide.coreAction.primaryItems}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {guide.coreAction.secondaryGan && (
                                        <div>
                                            <span className="inline-block px-2 py-0.5 bg-gray-500 text-white rounded text-xs font-bold mr-1.5">
                                                {guide.coreAction.secondaryGan}
                                            </span>
                                            <span className="text-gray-600">
                                                {guide.coreAction.secondaryActions || guide.coreAction.secondaryTraits}
                                            </span>
                                            {guide.coreAction.secondaryItems && (
                                                <div className="ml-7 mt-0.5 text-xs text-gray-500">
                                                    物品：{guide.coreAction.secondaryItems}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 輔助姿態/物品 */}
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-lg">🎨</span>
                                    <span className="text-sm font-bold text-purple-800">輔助姿態 / 物品（神星門為輔）</span>
                                </div>
                                <div className="space-y-2">
                                    {guide.auxiliary.map((a, i) => (
                                        <div key={i} className="text-sm">
                                            <span className="inline-block px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold mr-1.5">
                                                {a.source}
                                            </span>
                                            <span className="text-gray-700">{a.suggestion}</span>
                                            {a.items && (
                                                <div className="ml-7 mt-0.5 text-xs text-gray-500">
                                                    物品：{a.items}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 次數 & 觀想 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                                    <div className="text-lg">🔢</div>
                                    <div className="text-xs text-gray-500 mt-0.5">執行次數</div>
                                    <div className="text-2xl font-bold text-green-700">{guide.repeatCount}</div>
                                    <div className="text-xs text-gray-400">（{guide.palaceName}數字）</div>
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                    <div className="text-lg">🧘</div>
                                    <div className="text-xs text-gray-500 mt-0.5">觀想指引</div>
                                    <p className="text-sm text-indigo-700 mt-1 leading-relaxed">{guide.visualization}</p>
                                </div>
                            </div>

                            {/* 安全提示 */}
                            {guide.safetyNote && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                                    <span className="text-lg shrink-0">💡</span>
                                    <p className="text-sm text-yellow-800">{guide.safetyNote}</p>
                                </div>
                            )}

                            {/* 底部提示 */}
                            <p className="text-[11px] text-gray-400 text-center pt-1">
                                做完行為風水後，物品即可收起。最重要的是「動作行為」——動而感應。
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon, label, value }) {
    return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <div className="text-lg">{icon}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            <div className="text-sm font-bold text-gray-800 mt-0.5">{value}</div>
        </div>
    );
}

/**
 * 符號象徵知識小卡 Modal
 */
export function SymbolKnowledgeModal({ onClose }) {
    const sections = [
        {
            title: '八神象徵',
            emoji: '🏛️',
            color: 'amber',
            data: Object.entries(BA_SHEN_DATA),
        },
        {
            title: '九星象徵',
            emoji: '⭐',
            color: 'blue',
            data: Object.entries(JIU_XING_DATA),
        },
        {
            title: '八門象徵（四吉門）',
            emoji: '🚪',
            color: 'green',
            data: Object.entries(BA_MEN_DATA).filter(([, v]) => v.actions),
        },
        {
            title: '天干象徵',
            emoji: '🌿',
            color: 'purple',
            data: Object.entries(TIAN_GAN_DATA),
        },
    ];

    const colorMap = {
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-600', title: 'text-amber-800' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', title: 'text-blue-800' },
        green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-600', title: 'text-green-800' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-600', title: 'text-purple-800' },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="h-2 rounded-t-2xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
                <div className="flex items-center justify-between px-5 pt-4 pb-2 sticky top-0 bg-white z-10 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📖</span>
                        奇門符號象徵速查
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-5 pb-5 space-y-4 mt-3">
                    {sections.map(sec => {
                        const c = colorMap[sec.color];
                        return (
                            <div key={sec.title}>
                                <h3 className={`text-sm font-bold ${c.title} flex items-center gap-1.5 mb-2`}>
                                    <span>{sec.emoji}</span> {sec.title}
                                </h3>
                                <div className="space-y-1.5">
                                    {sec.data.map(([name, info]) => (
                                        <div key={name} className={`p-2.5 ${c.bg} border ${c.border} rounded-lg`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-block px-2 py-0.5 ${c.badge} text-white rounded text-xs font-bold`}>
                                                    {name}
                                                </span>
                                                <span className="text-xs text-gray-500">（{info.wuxing}）</span>
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-0.5 ml-1">
                                                <div><b>特質：</b>{info.traits}</div>
                                                {info.items && <div><b>物品：</b>{info.items}</div>}
                                                {info.actions && <div><b>動作：</b>{info.actions}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <p className="text-[11px] text-gray-400 text-center pt-2">
                        資料來源：九宮奇門 第六堂課「行為風水開運法」
                    </p>
                </div>
            </div>
        </div>
    );
}
