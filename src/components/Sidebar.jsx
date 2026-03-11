import { useState, useMemo } from 'react';
import { Lunar, Solar } from 'lunar-javascript';
import { CHINA_PROVINCES, OVERSEAS_COUNTRIES, fmtOffset, calcSolarTimeCorrectionMinutes } from '../data/locationData';

const YEARS = Array.from({ length: 150 }, (_, i) => 1900 + i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'];

function pad(n) { return String(n).padStart(2, '0'); }

// 計算某農曆年份的月份（含閏月）
function getLunarMonthsOfYear(lunarYear) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
        months.push({ month: m, isLeap: false, label: `${LUNAR_MONTHS[m - 1]}月` });
    }
    // 找閏月
    try {
        for (let m = 1; m <= 12; m++) {
            const lunar = Lunar.fromYmd(lunarYear, m, 1);
            if (lunar.getYearInGanZhi && lunar.getLeapMonth && lunar.getLeapMonth() === m) {
                months.splice(m, 0, { month: m, isLeap: true, label: `閏${LUNAR_MONTHS[m - 1]}月` });
                break;
            }
        }
    } catch (e) { /* ignore */ }
    return months;
}

// 取得農曆某月的最大天數
function getLunarDaysInMonth(lunarYear, lunarMonth, isLeap) {
    try {
        const lunar = Lunar.fromYmd(lunarYear, lunarMonth, 1);
        return isLeap ? lunar.getYearLeapDays?.() || 29 : lunar.getMonthDays?.() || 30;
    } catch {
        return 30;
    }
}

export function Sidebar({ timeParams, setTimeParams, chartType, setChartType, gender, setGender, onCalculate, onClear, savedRecords, onSaveRecord, onLoadRecord, onDeleteRecord }) {
    const { year, month, day, hour, minute } = timeParams;
    const [selectedRecordId, setSelectedRecordId] = useState('');

    // ── 公曆/農曆切換
    const [calMode, setCalMode] = useState('solar'); // 'solar' | 'lunar'

    // ── 農曆輸入狀態
    const [lunarYear, setLunarYear] = useState(() => (new Date()).getFullYear());
    const [lunarMonth, setLunarMonth] = useState(1);
    const [lunarIsLeap, setLunarIsLeap] = useState(false);
    const [lunarDay, setLunarDay] = useState(1);
    const [lunarHour, setLunarHour] = useState(12);
    const [lunarMinute, setLunarMinute] = useState(0);

    // 農曆月份列表
    const lunarMonthList = useMemo(() => getLunarMonthsOfYear(lunarYear), [lunarYear]);
    const maxLunarDay = useMemo(() => getLunarDaysInMonth(lunarYear, lunarMonth, lunarIsLeap), [lunarYear, lunarMonth, lunarIsLeap]);

    // ── 夏令時（DST）
    const [isDst, setIsDst] = useState(false);

    // ── 真太陽時開關
    const [useSolarTimeCorr, setUseSolarTimeCorr] = useState(true);

    // ── 地區選擇：是否展開
    const [locationOpen, setLocationOpen] = useState(false);
    const [locationTab, setLocationTab] = useState('china'); // 'china' | 'overseas'

    // 國內地區
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState(null); // { name, lng }

    // 海外地區
    const [selectedCountry, setSelectedCountry] = useState(null); // { name, offset, dstOffset, stdLng }
    // 海外地區分組
    const overseasRegions = useMemo(() => {
        const groups = {};
        OVERSEAS_COUNTRIES.forEach(c => {
            if (!groups[c.region]) groups[c.region] = [];
            groups[c.region].push(c);
        });
        return groups;
    }, []);

    // 當前選中省份的城市
    const citiesOfProvince = useMemo(() => {
        if (!selectedProvince) return [];
        return CHINA_PROVINCES.find(p => p.province === selectedProvince)?.cities || [];
    }, [selectedProvince]);

    // 真太陽時修正（分鐘）
    const solarTimeCorr = useMemo(() => {
        if (locationTab === 'china' && selectedCity) {
            return calcSolarTimeCorrectionMinutes(selectedCity.lng);
        }
        return 0;
    }, [locationTab, selectedCity]);

    // ── 顯示地區名稱
    const locationLabel = useMemo(() => {
        if (locationTab === 'china' && selectedCity) return `${selectedProvince} · ${selectedCity.name}`;
        if (locationTab === 'overseas' && selectedCountry) return `${selectedCountry.name} ${fmtOffset(selectedCountry.offset)}`;
        return '未設定';
    }, [locationTab, selectedCity, selectedCountry, selectedProvince]);

    // ── 公曆時間設定器
    const setYear = (y) => setTimeParams({ ...timeParams, year: y });
    const setMonth = (m) => setTimeParams({ ...timeParams, month: m });
    const setDay = (d) => setTimeParams({ ...timeParams, day: d });
    const setHour = (h) => setTimeParams({ ...timeParams, hour: h });
    const setMinute = (min) => setTimeParams({ ...timeParams, minute: min });

    const handleNow = () => {
        const n = new Date();
        setTimeParams({ year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: n.getHours(), minute: n.getMinutes() });
    };

    // ── 農曆 → 公曆轉換並排盤
    const convertLunarToSolar = () => {
        try {
            const solar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay).getSolar();
            return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(), hour: lunarHour, minute: lunarMinute };
        } catch (e) {
            alert('農曆日期轉換失敗，請確認日期是否正確');
            return null;
        }
    };

    // ── 計算最終排盤時間（公曆 + DST修正 + 真太陽時修正）
    const computeFinalParams = (baseParams) => {
        let finalParams = { ...baseParams };

        // 海外：將出生時間轉換為 UTC，再換算為 UTC+8 後排盤
        if (locationTab === 'overseas' && selectedCountry) {
            const { offset, dstOffset } = selectedCountry;
            const effectiveOffset = isDst && dstOffset != null ? dstOffset : offset;
            const chinaOffset = 8;
            // 轉換：先把當地時間轉為 UTC，再加 8 小時得北京時間
            const d = new Date(Date.UTC(finalParams.year, finalParams.month - 1, finalParams.day, finalParams.hour - effectiveOffset, finalParams.minute));
            d.setUTCHours(d.getUTCHours() + chinaOffset);
            finalParams = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
        }

        // 國內：真太陽時修正（命盤用）
        if (chartType === '命盤' && locationTab === 'china' && selectedCity && useSolarTimeCorr) {
            const d = new Date(finalParams.year, finalParams.month - 1, finalParams.day, finalParams.hour, finalParams.minute + solarTimeCorr);
            finalParams = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
        }

        // 國內夏令時（歷史上台灣/中國大陸曾使用）
        if (isDst && locationTab === 'china') {
            const d = new Date(finalParams.year, finalParams.month - 1, finalParams.day, finalParams.hour - 1, finalParams.minute);
            finalParams = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
        }

        return finalParams;
    };

    const handleCalc = () => {
        let baseParams = timeParams;
        if (calMode === 'lunar') {
            const converted = convertLunarToSolar();
            if (!converted) return;
            baseParams = converted;
            setTimeParams(converted);
        }
        onCalculate(computeFinalParams(baseParams));
    };

    const handleShiftJu = (hoursToAdd) => {
        const d = new Date(year, month - 1, day, hour, minute);
        d.setHours(d.getHours() + hoursToAdd);
        const newParams = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
        setTimeParams(newParams);
        onCalculate(newParams);
    };

    const isMingPan = chartType === '命盤';

    return (
        <aside className="w-full md:w-[300px] flex-shrink-0 bg-white p-4 md:p-6 border-r border-gray-200 overflow-y-auto">

            {/* ── 設定時間 ── */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-700">設定時間：</h2>
                {/* 公曆/農曆切換（命盤時才顯示） */}
                {isMingPan && (
                    <div className="flex bg-gray-100 rounded-full p-0.5 border border-gray-200">
                        {['solar', 'lunar'].map(mode => (
                            <button key={mode}
                                onClick={() => setCalMode(mode)}
                                className={`px-3 py-0.5 rounded-full text-xs font-bold transition-colors ${calMode === mode ? 'bg-white text-[#8b5a7a] shadow-sm' : 'text-gray-500'}`}>
                                {mode === 'solar' ? '公曆' : '農曆'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 公曆輸入 */}
            {calMode === 'solar' && (
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-1.5">
                        <select value={year} onChange={e => setYear(+e.target.value)}
                            className="flex-1 h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-1 focus:outline-none focus:border-blue-500">
                            {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                        <select value={month} onChange={e => setMonth(+e.target.value)}
                            className="flex-1 h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-1 focus:outline-none focus:border-blue-500">
                            {MONTHS.map(m => <option key={m} value={m}>{m}月</option>)}
                        </select>
                        <select value={day} onChange={e => setDay(+e.target.value)}
                            className="flex-1 h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-1 focus:outline-none focus:border-blue-500">
                            {DAYS.map(d => <option key={d} value={d}>{d}日</option>)}
                        </select>
                    </div>
                    <div className="flex gap-1.5">
                        <select value={hour} onChange={e => setHour(+e.target.value)}
                            className="flex-1 h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-1 focus:outline-none focus:border-blue-500">
                            {HOURS.map(h => <option key={h} value={h}>{h}時</option>)}
                        </select>
                        <select value={minute} onChange={e => setMinute(+e.target.value)}
                            className="flex-1 h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-1 focus:outline-none focus:border-blue-500">
                            {MINUTES.map(m => <option key={m} value={m}>{pad(m)}分</option>)}
                        </select>
                        <button onClick={handleNow}
                            className="flex-1 h-8 text-xs text-blue-500 font-medium border-2 border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                            現在時間
                        </button>
                    </div>
                </div>
            )}

            {/* 農曆輸入 */}
            {calMode === 'lunar' && (
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-1.5">
                        <select value={lunarYear} onChange={e => { setLunarYear(+e.target.value); setLunarIsLeap(false); setLunarDay(1); }}
                            className="flex-1 h-8 text-sm text-[#8b5a7a] font-medium border-2 border-purple-300 rounded-md px-1 focus:outline-none">
                            {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                        <select value={`${lunarMonth}-${lunarIsLeap}`}
                            onChange={e => {
                                const [m, leap] = e.target.value.split('-');
                                setLunarMonth(+m);
                                setLunarIsLeap(leap === 'true');
                                setLunarDay(1);
                            }}
                            className="flex-1 h-8 text-sm text-[#8b5a7a] font-medium border-2 border-purple-300 rounded-md px-1 focus:outline-none">
                            {lunarMonthList.map(({ month: m, isLeap, label }) => (
                                <option key={`${m}-${isLeap}`} value={`${m}-${isLeap}`}>{label}</option>
                            ))}
                        </select>
                        <select value={lunarDay} onChange={e => setLunarDay(+e.target.value)}
                            className="flex-1 h-8 text-sm text-[#8b5a7a] font-medium border-2 border-purple-300 rounded-md px-1 focus:outline-none">
                            {Array.from({ length: maxLunarDay }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>{d}日</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-1.5">
                        <select value={lunarHour} onChange={e => setLunarHour(+e.target.value)}
                            className="flex-1 h-8 text-sm text-[#8b5a7a] font-medium border-2 border-purple-300 rounded-md px-1 focus:outline-none">
                            {HOURS.map(h => <option key={h} value={h}>{h}時</option>)}
                        </select>
                        <select value={lunarMinute} onChange={e => setLunarMinute(+e.target.value)}
                            className="flex-1 h-8 text-sm text-[#8b5a7a] font-medium border-2 border-purple-300 rounded-md px-1 focus:outline-none">
                            {MINUTES.map(m => <option key={m} value={m}>{pad(m)}分</option>)}
                        </select>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center">農曆輸入</p>
                </div>
            )}

            {/* 夏令時開關（命盤才顯示） */}
            {isMingPan && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-xs text-gray-600 font-medium">夏令時（DST）</span>
                    <button
                        onClick={() => setIsDst(v => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isDst ? 'bg-[#4395CA]' : 'bg-gray-300'}`}
                        aria-label="夏令時開關">
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDst ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-bold min-w-[20px] ${isDst ? 'text-[#4395CA]' : 'text-gray-400'}`}>{isDst ? '開' : '關'}</span>
                </div>
            )}

            {/* 出生地區設定（命盤才顯示） */}
            {isMingPan && (
                <div className="mb-4">
                    <button
                        onClick={() => setLocationOpen(v => !v)}
                        className="w-full flex justify-between items-center text-sm font-bold text-gray-700 mb-2 py-1 border-b border-gray-200 hover:text-[#4395CA] transition-colors">
                        <span>選擇出生地：</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-[#4395CA] max-w-[120px] truncate">{locationLabel}</span>
                            <span>{locationOpen ? '▲' : '▼'}</span>
                        </div>
                    </button>

                    {locationOpen && (
                        <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                            {/* 分頁 */}
                            <div className="flex bg-white rounded-full p-0.5 border border-gray-200 mb-3">
                                {[['china', '國內'], ['overseas', '海外']].map(([key, label]) => (
                                    <button key={key}
                                        onClick={() => setLocationTab(key)}
                                        className={`flex-1 py-0.5 rounded-full text-xs font-bold transition-colors ${locationTab === key ? 'bg-[#8b5a7a] text-white shadow-sm' : 'text-gray-500'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* 國內選擇 */}
                            {locationTab === 'china' && (
                                <div className="flex flex-col gap-1.5">
                                    <select
                                        value={selectedProvince}
                                        onChange={e => { setSelectedProvince(e.target.value); setSelectedCity(null); }}
                                        className="w-full h-8 text-xs text-gray-700 border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:border-[#4395CA]">
                                        <option value="">選擇省份 / 直轄市 / 地區</option>
                                        {CHINA_PROVINCES.map(p => (
                                            <option key={p.province} value={p.province}>{p.province}</option>
                                        ))}
                                    </select>
                                    {selectedProvince && (
                                        <select
                                            value={selectedCity?.name || ''}
                                            onChange={e => {
                                                const city = citiesOfProvince.find(c => c.name === e.target.value);
                                                setSelectedCity(city || null);
                                            }}
                                            className="w-full h-8 text-xs text-gray-700 border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:border-[#4395CA]">
                                            <option value="">選擇城市</option>
                                            {citiesOfProvince.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {selectedCity && (
                                        <div className="text-[11px] text-gray-500 px-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span>經度 {selectedCity.lng}°E
                                                {solarTimeCorr !== 0 && (
                                                    <span className={solarTimeCorr > 0 ? ' text-blue-500' : ' text-orange-500'}>
                                                        {' '}（修正 {solarTimeCorr > 0 ? '+' : ''}{solarTimeCorr} 分）
                                                    </span>
                                                )}
                                                {solarTimeCorr === 0 && <span className="text-green-500"> （無需修正）</span>}
                                                </span>
                                                <div className="flex items-center gap-1.5 ml-2">
                                                    <span className="text-[11px] text-gray-500">真太陽時</span>
                                                    <button
                                                        onClick={() => setUseSolarTimeCorr(v => !v)}
                                                        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${useSolarTimeCorr ? 'bg-[#4395CA]' : 'bg-gray-300'}`}>
                                                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${useSolarTimeCorr ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                    <span className={`text-[11px] font-bold ${useSolarTimeCorr ? 'text-[#4395CA]' : 'text-gray-400'}`}>
                                                        {useSolarTimeCorr ? '開' : '關'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 海外選擇 */}
                            {locationTab === 'overseas' && (
                                <div className="flex flex-col gap-1.5">
                                    <select
                                        value={selectedCountry?.name || ''}
                                        onChange={e => {
                                            const c = OVERSEAS_COUNTRIES.find(x => x.name === e.target.value);
                                            setSelectedCountry(c || null);
                                        }}
                                        className="w-full h-8 text-xs text-gray-700 border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:border-[#4395CA]">
                                        <option value="">選擇國家 / 地區</option>
                                        {Object.entries(overseasRegions).map(([region, countries]) => (
                                            <optgroup key={region} label={`── ${region} ──`}>
                                                {countries.map(c => (
                                                    <option key={c.name} value={c.name}>
                                                        {c.name} {fmtOffset(c.offset)}{c.dstOffset != null ? ` / 夏令${fmtOffset(c.dstOffset)}` : ''}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {selectedCountry && (
                                        <div className="text-[11px] text-gray-500 px-1">
                                            標準時 {fmtOffset(selectedCountry.offset)}
                                            {selectedCountry.dstOffset != null && ` · 夏令時 ${fmtOffset(selectedCountry.dstOffset)}`}
                                            <br />
                                            <span className="text-blue-500">出生時間將自動換算為 UTC+8 後排盤</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── 排盤系統 ── */}
            <h2 className="text-sm font-bold text-gray-700 mb-2">排盤系統：</h2>
            <select
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-3 focus:outline-none shrink-0">
                <option value="時家置閏">時家置閏</option>
                <option value="陰盤奇門">陰盤奇門</option>
                <option value="年家奇門">年家奇門</option>
                <option value="月家奇門">月家奇門</option>
                <option value="日家奇門">日家奇門</option>
                <option value="命盤">命盤</option>
            </select>

            {/* 命盤專屬設定：性別 */}
            {isMingPan && (
                <div className="flex gap-4 mb-3 items-center">
                    <span className="text-sm font-bold text-gray-700">性別：</span>
                    {['男', '女'].map(g => (
                        <label key={g} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="gender" value={g} checked={gender === g}
                                onChange={e => setGender(e.target.value)}
                                className={g === '男' ? 'text-blue-600' : 'text-pink-500'} />
                            <span className="text-sm text-gray-700">{g}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* ── 排盤按鈕 ── */}
            <div className="flex gap-2 mb-2">
                <button onClick={onSaveRecord} className="flex-1 h-8 text-xs text-pink-500 font-bold border-2 border-pink-200 bg-pink-50/50 rounded-md hover:bg-pink-50 transition-colors">
                    儲存排盤
                </button>
                <button onClick={handleCalc}
                    className="flex-1 h-8 text-xs text-white font-bold bg-[#4395CA] border-2 border-[#4395CA] rounded-md hover:bg-[#347BA9] transition-colors">
                    開始排盤
                </button>
            </div>
            <div className="flex gap-2 mb-5">
                <button onClick={() => handleShiftJu(-2)}
                    className="flex-1 h-8 text-xs text-blue-600 font-bold border-2 border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                    上一局
                </button>
                <button onClick={() => handleShiftJu(2)}
                    className="flex-1 h-8 text-xs text-blue-600 font-bold border-2 border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                    下一局
                </button>
            </div>

            {/* ── 瀏覽儲存的盤局 ── */}
            <h2 className="text-sm font-bold text-gray-700 mb-2">瀏覽儲存的盤局：</h2>
            <select
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-2 bg-white">
                <option>依時間排序</option>
            </select>
            <select
                value={selectedRecordId}
                onChange={e => setSelectedRecordId(e.target.value)}
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-3 bg-white">
                <option value="">請選擇儲存盤局</option>
                {savedRecords && savedRecords.filter(r => (r.chartType || '時家置閏') === chartType).map(r => (
                    <option key={r.id} value={r.id}>{r.remark} ({r.chartType || '時家置閏'})</option>
                ))}
            </select>
            <div className="flex gap-2">
                <button onClick={() => { onDeleteRecord(selectedRecordId); setSelectedRecordId(''); }} disabled={!selectedRecordId}
                    className="flex-1 h-8 text-xs text-pink-500 font-bold border-2 border-pink-200 bg-pink-50/50 rounded-md hover:bg-pink-50 transition-colors disabled:opacity-50 text-center flex items-center justify-center">
                    刪除紀錄
                </button>
                <button onClick={() => onLoadRecord(selectedRecordId)} disabled={!selectedRecordId}
                    className="flex-1 h-8 text-xs text-white font-bold bg-[#4395CA] border-2 border-[#4395CA] rounded-md hover:bg-[#347BA9] transition-colors disabled:opacity-50 text-center flex items-center justify-center">
                    顯示盤局
                </button>
            </div>
        </aside>
    );
}
