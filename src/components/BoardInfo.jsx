const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function InfoItem({ label, value, valueClass = "text-[#4395CA]" }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 tracking-wider min-w-[3em]">{label}：</span>
            <span className={`text-sm font-bold tracking-widest ${valueClass}`}>{value}</span>
        </div>
    );
}

export function BoardInfo({ result }) {
    if (!result) return null;

    const { solar, lunar, siZhu,
        jieqiName, yuanName, juNum, isYin, yinYang,
        xunShou, kongWang, yiMa, fuTou, zhiFuXing, zhiShiMen, chartType, gender, fuYinFanYin } = result;

    const isMingPan = chartType === '命盤';

    const pad = n => String(n).padStart(2, '0');
    const solarStr = `${solar.year} 年 ${pad(solar.month)} 月 ${pad(solar.day)} 日 ${pad(solar.hour)} 時 ${pad(solar.minute)} 分 (${WEEK[solar.weekDay]})`;
    const lunarStr = `${lunar.year} 年 ${lunar.isLeap ? '閏' : ''}${pad(lunar.month)} 月 ${pad(lunar.day)} 日 ${pad(solar.hour)} 時`;

    return (
        <div className="w-full flex justify-center mb-4">
            <div className="w-fit flex flex-col items-center">
                {/* 日期資訊 */}
                <div className="w-full space-y-1 mb-4 flex flex-col items-center">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-700 tracking-widest">西元：</span>
                        <span className="text-sm text-gray-600 tracking-wider">{solarStr}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-700 tracking-widest">農曆：</span>
                        <span className="text-sm text-gray-600 tracking-wider">{lunarStr}</span>
                    </div>
                </div>

                {/* 四柱 */}
                <div className="grid grid-cols-5 gap-2 max-w-sm mb-6">
                    <div></div>
                    {['年柱', '月柱', '日柱', '時柱'].map(t => (
                        <div key={t} className="text-xs text-gray-500 text-center tracking-widest">{t}</div>
                    ))}
                    <div className="text-sm text-gray-700 tracking-widest self-center">天干：</div>
                    {[siZhu.yearGan, siZhu.monthGan, siZhu.dayGan, siZhu.hourGan].map((g, i) => (
                        <div key={i} className="text-[15px] font-bold text-gray-800 text-center">{g}</div>
                    ))}
                    <div className="text-sm text-gray-700 tracking-widest self-center">地支：</div>
                    {[siZhu.yearZhi, siZhu.monthZhi, siZhu.dayZhi, siZhu.hourZhi].map((z, i) => (
                        <div key={i} className="text-[15px] font-bold text-[#4395CA] text-center">{z}</div>
                    ))}
                </div>

                {/* 局盤資訊 */}
                <div className="grid grid-cols-3 gap-x-12 gap-y-1.5 max-w-xl mb-4 text-left">
                    <InfoItem label="起局" value={`${yinYang}${juNum} 局`} />
                    <InfoItem label="排盤" value={chartType} />
                    {isMingPan ? <div className="text-red-600 font-bold text-right pr-4 tracking-widest">{gender}命</div> : <div></div>}

                    <InfoItem label="旬首" value={xunShou} />
                    <InfoItem label="空亡" value={kongWang} valueClass="text-gray-800" />
                    <div></div>

                    <InfoItem label="符頭" value={fuTou} />
                    <InfoItem label="驛馬" value={yiMa} valueClass="text-gray-800" />
                    <div></div>

                    <InfoItem label="值符" value={zhiFuXing} />
                    <InfoItem label="值使" value={zhiShiMen} />
                    {fuYinFanYin ? <div className="text-red-600 font-bold text-right pr-4 tracking-widest">{fuYinFanYin}</div> : <div></div>}

                    {/* 也可將節氣/元資訊放在這裡補足 */}
                    <InfoItem label="節氣" value={`${jieqiName} · ${yuanName}`} valueClass="text-orange-600" />
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    );
}
