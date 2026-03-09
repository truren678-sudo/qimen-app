import React, { useState, useEffect, useMemo } from 'react';
import { getDailyAuspiciousData } from '../qimenCalendar';

const CHINESE_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const DOOR_COLORS = {
    '休門': 'text-[#00BFFF]', // 水藍色 (DeepSkyBlue)
    '生門': 'text-[#CDAA7D]', // 土黃色 (BurlyWood)
    '開門': 'text-[#FFD700]', // 金色 (Gold)
    '景門': 'text-red-500'
};
const DOOR_LABELS = {
    '全': '全部',
    '開': '工作事業',
    '休': '婚戀感情、貴人',
    '生': '求財生意',
    '景': '考試文昌'
};
const DIRECTIONS = ['所有方位', '北方', '東北方', '東方', '東南方', '南方', '西南方', '西方', '西北方'];
const NUM_TO_DIR = { 1: '北方', 8: '東北方', 3: '東方', 4: '東南方', 9: '南方', 2: '西南方', 7: '西方', 6: '西北方' };

export function QimenCalendarView() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [filterDoor, setFilterDoor] = useState('全');
    const [filterDir, setFilterDir] = useState('所有方位');
    const [filterTime, setFilterTime] = useState('全天');

    // 取得選取範圍內的所有天數資料
    const dailyDataList = useMemo(() => {
        const list = [];
        if (!startDate) return list;
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(startDate);

        // 交換確保 start <= end
        if (start > end) {
            const temp = start.getTime();
            start.setTime(end.getTime());
            end.setTime(temp);
        }

        const current = new Date(start);
        // 上限 30 天以防算太大崩潰
        let count = 0;
        while (current <= end && count < 30) {
            list.push(getDailyAuspiciousData(current.getFullYear(), current.getMonth() + 1, current.getDate()));
            current.setDate(current.getDate() + 1);
            count++;
        }
        return list;
    }, [startDate, endDate]);

    // 切換月份
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    // 產生月曆陣列
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentMonth]);

    const isSameDay = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    const isWithinRange = (date) => {
        if (!startDate || !endDate || !date) return false;
        const target = date.getTime();
        const s = startDate.getTime();
        const e = endDate.getTime();
        return (target >= Math.min(s, e) && target <= Math.max(s, e));
    };

    const handleDateClick = (date) => {
        if (!startDate || (startDate && endDate)) {
            // 重新選第一個日期
            setStartDate(date);
            setEndDate(null);
        } else {
            // 已選第一個，現在選第二個
            setEndDate(date);
        }
    };

    // 過濾出符合條件的宮位
    const getFilteredPalaces = (palaces) => {
        if (!palaces) return [];
        return palaces.filter(p => {
            if (!p.filterResult?.isAuspicious) return false;
            // 過濾門
            if (filterDoor !== '全' && p.door !== `${filterDoor}門`) return false;
            // 過濾方位
            if (filterDir !== '所有方位' && NUM_TO_DIR[p.num] !== filterDir) return false;
            return true;
        });
    };

    // 渲染摘要列表
    const renderSummary = (chart, title) => {
        if (!chart) return null;
        const validPalaces = getFilteredPalaces(chart.palaces);

        return (
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[18px] font-bold text-[#4395CA]">{title}</span>
                </div>
                {validPalaces.length > 0 ? (
                    <div className="text-sm text-gray-700 leading-relaxed">
                        {validPalaces.map((p, idx) => (
                            <div key={idx} className="mb-0.5">
                                <span className="font-bold">{NUM_TO_DIR[p.num]}</span>
                                <span className={`ml-1 font-bold ${DOOR_COLORS[p.door] || 'text-gray-700'}`}>{p.door}</span>
                                <span className="ml-1 text-gray-600">利{DOOR_LABELS[p.door.charAt(0)]}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-400">無符合條件之吉方</div>
                )}
            </div>
        );
    };

    // 渲染時辰列表
    const renderHourList = () => {
        if (!dailyDataList || dailyDataList.length === 0) return null;

        return (
            <div className="flex-1 bg-white mt-6 md:mt-0 md:ml-6 overflow-visible md:overflow-y-auto">
                {dailyDataList.map((dailyData, dayIdx) => {
                    const dateStr = `${dailyData.date.replace(/-/g, '/')} (週${CHINESE_WEEKDAYS[new Date(dailyData.date).getDay()]})`;

                    // 過濾指定時辰
                    const filteredHourCharts = dailyData.hourCharts.filter(h => filterTime === '全天' || `${h.zhi}時` === filterTime);

                    // 檢查當天是否完全沒結果
                    let hasAnyResult = false;

                    return (
                        <div key={dayIdx} className="mb-10 last:mb-0">
                            <div className="bg-[#8b5a7a] text-white px-4 py-1.5 text-sm font-bold sticky top-0 z-10 shadow-sm">
                                {dateStr}
                            </div>
                            <div className="p-6 pt-4">
                                {/* 日盤摘要置頂 */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    {renderSummary(dailyData.dayChart, '日盤')}
                                </div>

                                {/* 時辰列表 */}
                                <div className="flex flex-col gap-6">
                                    {filteredHourCharts.map((hData, idx) => {
                                        const validPalaces = getFilteredPalaces(hData.chart.palaces);
                                        if (validPalaces.length === 0) return null; // 若無吉方則不顯示該時辰

                                        hasAnyResult = true;
                                        return (
                                            <div key={idx} className="flex flex-col">
                                                <div className="flex items-end gap-2 mb-1">
                                                    <span className="text-[20px] font-bold text-gray-800">{hData.zhi}時</span>
                                                    <span className="text-[12px] text-gray-500 mb-1">{hData.timeRange}</span>
                                                </div>
                                                <div className="text-sm text-gray-700 leading-relaxed">
                                                    {validPalaces.map((p, pIdx) => (
                                                        <span key={pIdx}>
                                                            {pIdx > 0 && ' 、 '}
                                                            <span className="font-bold">{NUM_TO_DIR[p.num]}</span>
                                                            <span className={`font-bold ${DOOR_COLORS[p.door] || 'text-gray-700'}`}>{p.door}</span>
                                                            <span className="text-gray-600">利{DOOR_LABELS[p.door.charAt(0)]}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!hasAnyResult && (
                                        <div className="text-center text-gray-400 py-6">當日無符合條件之吉時吉方</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full max-w-6xl mx-auto w-full px-2 md:px-4 pt-4 pb-4 overflow-y-auto md:overflow-hidden">
            {/* 左側日曆與篩選區 */}
            <div className="flex flex-col w-full md:w-[350px] shrink-0">
                {/* 迷你日曆 */}
                <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="text-gray-500 hover:text-gray-800 font-bold px-2">&lt;</button>
                        <span className="font-bold text-gray-800">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                        <button onClick={nextMonth} className="text-gray-500 hover:text-gray-800 font-bold px-2">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {CHINESE_WEEKDAYS.map(w => <div key={w} className="text-[12px] text-gray-400 py-1">{w}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarDays.map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} className="p-1"></div>;
                            const isSelected = isSameDay(date, startDate) || isSameDay(date, endDate);
                            const inRange = isWithinRange(date);
                            const isToday = isSameDay(date, today);

                            let bgClass = 'text-gray-700 hover:bg-gray-100';
                            if (isSelected) bgClass = 'bg-[#4395CA] text-white font-bold';
                            else if (inRange) bgClass = 'bg-[#4395CA]/20 text-[#4395CA] font-bold';
                            else if (isToday) bgClass = 'bg-gray-100 text-[#4395CA] font-bold';

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleDateClick(date)}
                                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors ${bgClass}`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 年月盤摘要 (僅顯示起算日之盤象) */}
                <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 shadow-sm">
                    {dailyDataList.length > 0 && renderSummary(dailyDataList[0].yearChart, '年盤 (首日)')}
                    <div className="h-px bg-gray-100 w-full my-3"></div>
                    {dailyDataList.length > 0 && renderSummary(dailyDataList[0].monthChart, '月盤 (首日)')}
                </div>

                {/* 條件篩選面板 */}
                <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
                    <div className="text-[12px] text-gray-500 mb-2">條件篩選</div>
                    <div className="flex bg-[#4395CA] rounded-full p-1 mb-4 shadow-inner">
                        {['全', '開', '休', '生', '景'].map(door => (
                            <button
                                key={door}
                                onClick={() => setFilterDoor(door)}
                                className={`flex-1 text-center py-1.5 text-sm font-bold rounded-full transition-colors ${filterDoor === door ? 'bg-white text-[#4395CA] shadow-sm' : 'text-white/80 hover:text-white'}`}
                            >
                                {door}
                            </button>
                        ))}
                    </div>

                    <div className="text-[11px] text-gray-600 grid grid-cols-2 gap-y-2 mb-4 px-2">
                        <div>開門：<span className="text-gray-400">工作事業</span></div>
                        <div>生門：<span className="text-gray-400">求財生意</span></div>
                        <div>休門：<span className="text-gray-400">婚戀、貴人</span></div>
                        <div>景門：<span className="text-gray-400">考試文昌</span></div>
                    </div>

                    <div className="mb-4">
                        <div className="text-[11px] text-gray-500 mb-1">吉方方位</div>
                        <select
                            value={filterDir}
                            onChange={e => setFilterDir(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#4395CA]"
                        >
                            {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="mb-6">
                        <div className="text-[11px] text-gray-500 mb-1">指定時辰</div>
                        <select
                            value={filterTime}
                            onChange={e => setFilterTime(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#4395CA]"
                        >
                            <option value="全天">全部時辰 (全天)</option>
                            {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(z => (
                                <option key={z} value={`${z}時`}>{z}時</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { setFilterDoor('全'); setFilterDir('所有方位'); setFilterTime('全天'); }}
                            className="py-2 text-sm text-[#4395CA] border border-[#4395CA] rounded-md hover:bg-[#4395CA]/10 font-bold transition-colors"
                        >
                            重置條件
                        </button>
                        <button className="py-2 text-sm text-white bg-[#4395CA] rounded-md hover:bg-[#347BA9] font-bold transition-colors shadow">
                            確定
                        </button>
                    </div>
                </div>
            </div>

            {/* 右側吉時排行榜 */}
            {renderHourList()}
        </div>
    );
}
