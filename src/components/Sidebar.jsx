import { useState } from 'react';

const YEARS = Array.from({ length: 150 }, (_, i) => 1900 + i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n) { return String(n).padStart(2, '0'); }

export function Sidebar({ timeParams, setTimeParams, chartType, setChartType, gender, setGender, onCalculate, onClear, savedRecords, onSaveRecord, onLoadRecord, onDeleteRecord }) {
    const { year, month, day, hour, minute } = timeParams;
    const [selectedRecordId, setSelectedRecordId] = useState('');

    const setYear = (y) => setTimeParams({ ...timeParams, year: y });
    const setMonth = (m) => setTimeParams({ ...timeParams, month: m });
    const setDay = (d) => setTimeParams({ ...timeParams, day: d });
    const setHour = (h) => setTimeParams({ ...timeParams, hour: h });
    const setMinute = (min) => setTimeParams({ ...timeParams, minute: min });

    const handleNow = () => {
        const n = new Date();
        setTimeParams({
            year: n.getFullYear(),
            month: n.getMonth() + 1,
            day: n.getDate(),
            hour: n.getHours(),
            minute: n.getMinutes()
        });
    };

    const handleCalc = () => {
        onCalculate(timeParams);
    };

    const handleShiftJu = (hoursToAdd) => {
        const d = new Date(year, month - 1, day, hour, minute);
        d.setHours(d.getHours() + hoursToAdd);
        const newParams = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            hour: d.getHours(),
            minute: d.getMinutes(),
        };
        setTimeParams(newParams);
        onCalculate(newParams);
    };

    return (
        <aside className="w-[300px] flex-shrink-0 bg-white p-6 border-r border-gray-200">
            {/* 設定時間 */}
            <h2 className="text-sm font-bold text-gray-700 mb-3">設定時間：</h2>

            <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
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

                <div className="flex gap-2">
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

            {/* 排盤系統 */}
            <h2 className="text-sm font-bold text-gray-700 mb-3">排盤系統：</h2>
            <select
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-4 focus:outline-none shrink-0">
                <option value="時家置閏">時家置閏</option>
                <option value="陰盤奇門">陰盤奇門</option>
                <option value="年家奇門">年家奇門</option>
                <option value="月家奇門">月家奇門</option>
                <option value="日家奇門">日家奇門</option>
                <option value="命盤">命盤</option>
            </select>

            {/* 命盤專屬設定：性別 */}
            {chartType === '命盤' && (
                <div className="flex gap-4 mb-4 items-center">
                    <span className="text-sm font-bold text-gray-700">性別：</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="男"
                            checked={gender === '男'}
                            onChange={(e) => setGender(e.target.value)}
                            className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">男</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input
                            type="radio"
                            name="gender"
                            value="女"
                            checked={gender === '女'}
                            onChange={(e) => setGender(e.target.value)}
                            className="text-pink-500"
                        />
                        <span className="text-sm text-gray-700">女</span>
                    </label>
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <button onClick={onSaveRecord} className="flex-1 h-8 text-xs text-pink-500 font-bold border-2 border-pink-200 bg-pink-50/50 rounded-md hover:bg-pink-50 transition-colors">
                    儲存排盤
                </button>
                <button onClick={handleCalc}
                    className="flex-1 h-8 text-xs text-white font-bold bg-[#4395CA] border-2 border-[#4395CA] rounded-md hover:bg-[#347BA9] transition-colors">
                    開始排盤
                </button>
            </div>
            <div className="flex gap-2 mb-6">
                <button onClick={() => handleShiftJu(-2)}
                    className="flex-1 h-8 text-xs text-blue-600 font-bold border-2 border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                    上一局
                </button>
                <button onClick={() => handleShiftJu(2)}
                    className="flex-1 h-8 text-xs text-blue-600 font-bold border-2 border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                    下一局
                </button>
            </div>

            {/* 瀏覽儲存的盤局 */}
            <h2 className="text-sm font-bold text-gray-700 mb-3">瀏覽儲存的盤局：</h2>
            <select
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-3 bg-white">
                <option>依時間排序</option>
            </select>
            <select
                value={selectedRecordId}
                onChange={e => setSelectedRecordId(e.target.value)}
                className="w-full h-8 text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-2 mb-4 bg-white">
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
                <button onClick={() => onLoadRecord(selectedRecordId)} disabled={!selectedRecordId} className="flex-1 h-8 text-xs text-white font-bold bg-[#4395CA] border-2 border-[#4395CA] rounded-md hover:bg-[#347BA9] transition-colors disabled:opacity-50 text-center flex items-center justify-center">
                    顯示盤局
                </button>
            </div>
        </aside>
    );
}
