import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BoardInfo } from './components/BoardInfo';
import { NineGrid } from './components/NineGrid';
import { QimenCalendarView } from './components/QimenCalendarView';
import { calculateQimen } from './qimen';

function App() {
  const initDate = new Date();
  const [timeParams, setTimeParams] = useState({
    year: initDate.getFullYear(),
    month: initDate.getMonth() + 1,
    day: initDate.getDate(),
    hour: initDate.getHours(),
    minute: initDate.getMinutes()
  });

  const [gender, setGender] = useState('男');
  const [chartType, setChartType] = useState('時家置閏');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'calendar'
  const [mobileTab, setMobileTab] = useState('setting'); // 'setting' | 'result'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [remark, setRemark] = useState('');
  const [savedRecords, setSavedRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('qimen_saved_charts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const handleCalculate = (params = timeParams) => {
    try {
      setError(null);
      const res = calculateQimen(params.year, params.month, params.day, params.hour, params.minute, { chartType, gender });
      if (!res) {
        setError('排盤計算失敗，請確認輸入時間是否正確。');
        return;
      }
      setResult(res);
      setTimeParams(params);
      setMobileTab('result'); // 排盤後自動切換到結果頁
    } catch (e) {
      console.error(e);
      setError('計算發生錯誤：' + e.message);
    }
  };

  const handleTimeShift = (type) => {
    if (!result) return;
    const d = new Date(timeParams.year, timeParams.month - 1, timeParams.day, timeParams.hour, timeParams.minute);
    if (type === '上日') d.setDate(d.getDate() - 1);
    if (type === '次日') d.setDate(d.getDate() + 1);
    if (type === '現時') d.setTime(new Date().getTime());
    if (type === '上時') d.setHours(d.getHours() - 2);
    if (type === '下時') d.setHours(d.getHours() + 2);

    const newParams = {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes()
    };
    setTimeParams(newParams);
    handleCalculate(newParams);
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  const handleSaveRecord = () => {
    if (!result) {
      alert('請先排盤再進行儲存！');
      return;
    }
    const pad = n => String(n).padStart(2, '0');
    const defaultRemark = `${result.solar.year}/${pad(result.solar.month)}/${pad(result.solar.day)} ${pad(result.solar.hour)}:${pad(result.solar.minute)} ${chartType === '命盤' ? `命盤(${gender})` : '時盤'}`;
    const newRecord = {
      id: Date.now(),
      timeParams,
      chartType,
      gender,
      remark: remark || defaultRemark,
    };
    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    localStorage.setItem('qimen_saved_charts', JSON.stringify(updated));
    setRemark('');
    alert('盤局已儲存成功！');
  };

  const handleLoadRecord = (idStr) => {
    const id = Number(idStr);
    const record = savedRecords.find(r => r.id === id);
    if (!record) return;
    setTimeParams(record.timeParams);
    setChartType(record.chartType || '時家置閏');
    if (record.gender) setGender(record.gender);
    try {
      setError(null);
      const res = calculateQimen(record.timeParams.year, record.timeParams.month, record.timeParams.day, record.timeParams.hour, record.timeParams.minute, { chartType: record.chartType || '時家置閏', gender: record.gender || '男' });
      if (res) { setResult(res); setMobileTab('result'); }
    } catch (e) {
      console.error(e);
      setError('載入舊盤局發生錯誤');
    }
  };

  const handleDeleteRecord = (idStr) => {
    if (!idStr) {
      alert('請先選擇要刪除的盤局');
      return;
    }
    if (window.confirm('確定要刪除此盤局紀錄嗎？')) {
      const id = Number(idStr);
      const updated = savedRecords.filter(r => r.id !== id);
      setSavedRecords(updated);
      localStorage.setItem('qimen_saved_charts', JSON.stringify(updated));
    }
  };

  // ── 排盤結果區（共用）
  const ResultArea = () => (
    <main className="flex-1 flex flex-col p-3 md:p-4 overflow-auto min-w-0">
      <div className="w-full bg-white border border-gray-300 mb-4 p-2 shadow-sm rounded-sm">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-bold text-gray-700 tracking-wider">排盤結果</h2>
          <span className="text-[10px] text-gray-400">{result?.chartType || '時家奇門遁甲'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-sm px-4 py-2 text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      <div className="flex flex-col mx-auto w-full bg-[#f2f4f7] p-3 md:p-6 border border-gray-200 shadow-sm rounded-md relative">
        {/* 盤局資訊區 */}
        <BoardInfo result={result} />

        {/* 九宮格 */}
        {result && (
          <div className="mt-4 w-full flex justify-center px-1 md:px-0 py-2">
            <NineGrid result={result} />
          </div>
        )}

        {/* 底部按鈕 */}
        {result && (
          <div className="mt-8 w-full max-w-[500px] mx-auto flex flex-col items-center">
            <div className="flex justify-between w-full px-4 mb-6">
              {['上日', '次日', '現時', '上時', '下時'].map(btn => (
                <button key={btn}
                  onClick={() => handleTimeShift(btn)}
                  className="text-sm font-bold text-[#4395CA] hover:text-[#347BA9] transition-colors px-2 py-1">
                  {btn}
                </button>
              ))}
            </div>

            <div className="w-full">
              <h3 className="text-xs font-bold text-gray-700 mb-2 tracking-wider">盤局備註說明：</h3>
              <p className="text-xs text-gray-600 mb-2">奇門四害: <span className="text-[#B8860B] font-bold">入墓(墓)</span>、<span className="text-purple-600 font-bold">擊刑(刑)</span>、<span className="text-red-500 font-bold">門迫(迫)</span>、<span className="text-blue-600 font-bold">擊刑+入墓(刑)</span></p>
              <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="可在此輸入儲存用的自訂盤局名稱..." className="w-full h-10 border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:border-[#4395CA] mb-4" />

              <div className="flex justify-center">
                <button onClick={handleSaveRecord} className="h-10 px-8 text-sm text-white font-bold bg-[#4395CA] border border-[#4395CA] rounded-md shadow hover:bg-[#347BA9] transition-colors">
                  儲存此盤局
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // ── Sidebar 包裝（共用）
  const SidebarArea = () => (
    <Sidebar
      timeParams={timeParams}
      setTimeParams={setTimeParams}
      chartType={chartType}
      setChartType={setChartType}
      gender={gender}
      setGender={setGender}
      onCalculate={handleCalculate}
      onClear={handleClear}
      savedRecords={savedRecords}
      onSaveRecord={handleSaveRecord}
      onLoadRecord={handleLoadRecord}
      onDeleteRecord={handleDeleteRecord}
    />
  );

  return (
    <div className="flex flex-col h-screen bg-[#eef1f5] font-sans overflow-hidden">

      {/* ── 頂部導覽列（奇門排盤 / 奇門曆） ── */}
      <div className="flex justify-center items-center bg-white border-b border-gray-300 py-2 shadow-sm z-20 shrink-0">
        <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-1.5 rounded-full text-[14px] font-bold tracking-widest transition-colors ${viewMode === 'calendar' ? 'bg-white text-[#8b5a7a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            奇門曆
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-6 py-1.5 rounded-full text-[14px] font-bold tracking-widest transition-colors ${viewMode === 'chart' ? 'bg-white text-[#8b5a7a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            奇門排盤
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <QimenCalendarView />
      ) : (
        <>
          {/* ── 桌面版：左右並排（md 以上） ── */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <SidebarArea />
            <ResultArea />
          </div>

          {/* ── 手機版：分頁切換 ── */}
          <div className="flex md:hidden flex-1 flex-col overflow-hidden">
            {/* 內容區 */}
            <div className="flex-1 overflow-hidden">
              {mobileTab === 'setting' ? (
                <div className="h-full overflow-y-auto">
                  <SidebarArea />
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <ResultArea />
                </div>
              )}
            </div>

            {/* 底部分頁欄 */}
            <div className="shrink-0 flex bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
              <button
                onClick={() => setMobileTab('setting')}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${mobileTab === 'setting' ? 'text-[#4395CA]' : 'text-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="text-[11px] font-bold">排盤設定</span>
              </button>
              <button
                onClick={() => setMobileTab('result')}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${mobileTab === 'result' ? 'text-[#4395CA]' : 'text-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-[11px] font-bold">排盤結果 {result && '✓'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;


