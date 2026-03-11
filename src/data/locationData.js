/**
 * 地區資料 - 用於命盤出生地設定
 * 包含：中國省市（含真太陽時計算用經度）、海外國家時區
 */

// 中國標準時間基準經度（東八區）= 120°E
export const CHINA_STD_LNG = 120;

// 中國省份 & 主要城市（含代表性經度，用於真太陽時計算）
// 格式：{ province, cities: [{ name, lng }] }
export const CHINA_PROVINCES = [
  {
    province: '北京市',
    cities: [{ name: '北京市', lng: 116.4 }]
  },
  {
    province: '上海市',
    cities: [{ name: '上海市', lng: 121.5 }]
  },
  {
    province: '天津市',
    cities: [{ name: '天津市', lng: 117.2 }]
  },
  {
    province: '重慶市',
    cities: [{ name: '重慶市', lng: 106.5 }, { name: '萬州', lng: 108.4 }, { name: '涪陵', lng: 107.4 }]
  },
  {
    province: '廣東省',
    cities: [
      { name: '廣州', lng: 113.3 }, { name: '深圳', lng: 114.1 }, { name: '佛山', lng: 113.1 },
      { name: '東莞', lng: 113.7 }, { name: '珠海', lng: 113.6 }, { name: '汕頭', lng: 116.7 },
      { name: '惠州', lng: 114.4 }, { name: '中山', lng: 113.4 }, { name: '江門', lng: 113.1 },
      { name: '湛江', lng: 110.4 }, { name: '肇慶', lng: 112.5 }, { name: '梅州', lng: 116.1 },
    ]
  },
  {
    province: '江蘇省',
    cities: [
      { name: '南京', lng: 118.8 }, { name: '蘇州', lng: 120.6 }, { name: '無錫', lng: 120.3 },
      { name: '常州', lng: 119.9 }, { name: '南通', lng: 120.9 }, { name: '揚州', lng: 119.4 },
      { name: '徐州', lng: 117.2 }, { name: '鎮江', lng: 119.4 }, { name: '連雲港', lng: 119.2 },
    ]
  },
  {
    province: '浙江省',
    cities: [
      { name: '杭州', lng: 120.2 }, { name: '寧波', lng: 121.6 }, { name: '溫州', lng: 120.7 },
      { name: '紹興', lng: 120.6 }, { name: '金華', lng: 119.6 }, { name: '嘉興', lng: 120.7 },
      { name: '台州', lng: 121.4 }, { name: '舟山', lng: 122.2 },
    ]
  },
  {
    province: '四川省',
    cities: [
      { name: '成都', lng: 104.1 }, { name: '綿陽', lng: 104.7 }, { name: '德陽', lng: 104.4 },
      { name: '宜賓', lng: 104.6 }, { name: '南充', lng: 106.1 }, { name: '瀘州', lng: 105.4 },
      { name: '達州', lng: 107.5 }, { name: '樂山', lng: 103.8 }, { name: '自貢', lng: 104.8 },
    ]
  },
  {
    province: '湖南省',
    cities: [
      { name: '長沙', lng: 113.0 }, { name: '株洲', lng: 113.1 }, { name: '湘潭', lng: 112.9 },
      { name: '衡陽', lng: 112.6 }, { name: '岳陽', lng: 113.1 }, { name: '常德', lng: 111.7 },
      { name: '邵陽', lng: 111.5 },
    ]
  },
  {
    province: '湖北省',
    cities: [
      { name: '武漢', lng: 114.3 }, { name: '宜昌', lng: 111.3 }, { name: '襄陽', lng: 112.1 },
      { name: '荊州', lng: 112.2 }, { name: '荊門', lng: 112.2 }, { name: '十堰', lng: 110.8 },
    ]
  },
  {
    province: '河南省',
    cities: [
      { name: '鄭州', lng: 113.6 }, { name: '洛陽', lng: 112.4 }, { name: '開封', lng: 114.3 },
      { name: '新鄉', lng: 113.9 }, { name: '南陽', lng: 112.5 }, { name: '焦作', lng: 113.2 },
      { name: '安陽', lng: 114.3 },
    ]
  },
  {
    province: '河北省',
    cities: [
      { name: '石家莊', lng: 114.5 }, { name: '保定', lng: 115.5 }, { name: '唐山', lng: 118.2 },
      { name: '邯鄲', lng: 114.5 }, { name: '秦皇島', lng: 119.6 }, { name: '廊坊', lng: 116.7 },
      { name: '邢台', lng: 114.5 }, { name: '張家口', lng: 114.9 }, { name: '承德', lng: 117.9 },
    ]
  },
  {
    province: '山東省',
    cities: [
      { name: '濟南', lng: 117.0 }, { name: '青島', lng: 120.4 }, { name: '煙台', lng: 121.4 },
      { name: '濰坊', lng: 119.1 }, { name: '淄博', lng: 118.1 }, { name: '濟寧', lng: 116.6 },
      { name: '臨沂', lng: 118.4 }, { name: '威海', lng: 122.1 }, { name: '日照', lng: 119.5 },
    ]
  },
  {
    province: '山西省',
    cities: [
      { name: '太原', lng: 112.6 }, { name: '大同', lng: 113.3 }, { name: '陽泉', lng: 113.6 },
      { name: '長治', lng: 113.1 }, { name: '晉城', lng: 112.8 }, { name: '朔州', lng: 112.4 },
    ]
  },
  {
    province: '陝西省',
    cities: [
      { name: '西安', lng: 108.9 }, { name: '咸陽', lng: 108.7 }, { name: '寶雞', lng: 107.2 },
      { name: '渭南', lng: 109.5 }, { name: '漢中', lng: 107.0 }, { name: '延安', lng: 109.5 },
      { name: '榆林', lng: 109.7 },
    ]
  },
  {
    province: '遼寧省',
    cities: [
      { name: '瀋陽', lng: 123.4 }, { name: '大連', lng: 121.6 }, { name: '鞍山', lng: 123.0 },
      { name: '撫順', lng: 123.9 }, { name: '錦州', lng: 121.1 }, { name: '丹東', lng: 124.4 },
      { name: '本溪', lng: 123.8 },
    ]
  },
  {
    province: '吉林省',
    cities: [
      { name: '長春', lng: 125.3 }, { name: '吉林', lng: 126.6 }, { name: '四平', lng: 124.4 },
      { name: '延吉', lng: 129.5 }, { name: '通化', lng: 125.9 },
    ]
  },
  {
    province: '黑龍江省',
    cities: [
      { name: '哈爾濱', lng: 126.5 }, { name: '齊齊哈爾', lng: 123.9 }, { name: '大慶', lng: 125.0 },
      { name: '牡丹江', lng: 129.6 }, { name: '佳木斯', lng: 130.4 },
    ]
  },
  {
    province: '安徽省',
    cities: [
      { name: '合肥', lng: 117.3 }, { name: '蕪湖', lng: 118.4 }, { name: '馬鞍山', lng: 118.5 },
      { name: '安慶', lng: 117.1 }, { name: '淮南', lng: 117.0 }, { name: '蚌埠', lng: 117.4 },
    ]
  },
  {
    province: '福建省',
    cities: [
      { name: '福州', lng: 119.3 }, { name: '廈門', lng: 118.1 }, { name: '泉州', lng: 118.7 },
      { name: '莆田', lng: 119.0 }, { name: '漳州', lng: 117.6 }, { name: '三明', lng: 117.6 },
      { name: '南平', lng: 118.2 },
    ]
  },
  {
    province: '江西省',
    cities: [
      { name: '南昌', lng: 115.8 }, { name: '九江', lng: 116.0 }, { name: '上饒', lng: 117.9 },
      { name: '贛州', lng: 114.9 }, { name: '景德鎮', lng: 117.2 },
    ]
  },
  {
    province: '廣西壯族自治區',
    cities: [
      { name: '南寧', lng: 108.4 }, { name: '柳州', lng: 109.4 }, { name: '桂林', lng: 110.3 },
      { name: '梧州', lng: 111.3 }, { name: '玉林', lng: 110.2 }, { name: '北海', lng: 109.1 },
    ]
  },
  {
    province: '雲南省',
    cities: [
      { name: '昆明', lng: 102.7 }, { name: '曲靖', lng: 103.8 }, { name: '玉溪', lng: 102.5 },
      { name: '大理', lng: 100.2 }, { name: '麗江', lng: 100.2 }, { name: '保山', lng: 99.2 },
    ]
  },
  {
    province: '貴州省',
    cities: [
      { name: '貴陽', lng: 106.7 }, { name: '遵義', lng: 106.9 }, { name: '六盤水', lng: 104.8 },
      { name: '安順', lng: 105.9 },
    ]
  },
  {
    province: '海南省',
    cities: [
      { name: '海口', lng: 110.3 }, { name: '三亞', lng: 109.5 }, { name: '儋州', lng: 109.6 },
    ]
  },
  {
    province: '甘肅省',
    cities: [
      { name: '蘭州', lng: 103.8 }, { name: '嘉峪關', lng: 98.3 }, { name: '金昌', lng: 102.2 },
      { name: '天水', lng: 105.7 }, { name: '武威', lng: 102.6 },
    ]
  },
  {
    province: '青海省',
    cities: [
      { name: '西寧', lng: 101.8 }, { name: '格爾木', lng: 94.9 },
    ]
  },
  {
    province: '內蒙古自治區',
    cities: [
      { name: '呼和浩特', lng: 111.7 }, { name: '包頭', lng: 110.0 }, { name: '赤峰', lng: 118.9 },
      { name: '通遼', lng: 122.3 }, { name: '鄂爾多斯', lng: 109.8 }, { name: '呼倫貝爾', lng: 119.8 },
    ]
  },
  {
    province: '新疆維吾爾自治區',
    cities: [
      { name: '烏魯木齊', lng: 87.6 }, { name: '克拉瑪依', lng: 84.9 }, { name: '吐魯番', lng: 89.2 },
      { name: '哈密', lng: 93.5 }, { name: '喀什', lng: 75.9 }, { name: '和田', lng: 79.9 },
    ]
  },
  {
    province: '西藏自治區',
    cities: [
      { name: '拉薩', lng: 91.1 }, { name: '日喀則', lng: 88.9 }, { name: '林芝', lng: 94.4 },
    ]
  },
  {
    province: '寧夏回族自治區',
    cities: [
      { name: '銀川', lng: 106.3 }, { name: '石嘴山', lng: 106.4 },
    ]
  },
  {
    province: '台灣',
    cities: [
      { name: '台北', lng: 121.5 }, { name: '台中', lng: 120.7 }, { name: '高雄', lng: 120.3 },
      { name: '台南', lng: 120.2 }, { name: '新北市', lng: 121.5 }, { name: '桃園', lng: 121.3 },
      { name: '台東', lng: 121.1 }, { name: '花蓮', lng: 121.6 },
    ]
  },
  {
    province: '香港',
    cities: [
      { name: '香港（全區）', lng: 114.2 },
    ]
  },
  {
    province: '澳門',
    cities: [
      { name: '澳門（全區）', lng: 113.5 },
    ]
  },
];

// 海外國家時區（北半球及大洋洲）
// offset: 標準時區 UTC 偏移（小時）
// dstOffset: 夏令時 UTC 偏移（若有），null = 無夏令時
// stdLng: 時區基準經度（用於真太陽時計算）
export const OVERSEAS_COUNTRIES = [
  // 東亞
  { name: '日本', region: '東亞', offset: 9, dstOffset: null, stdLng: 135 },
  { name: '韓國', region: '東亞', offset: 9, dstOffset: null, stdLng: 135 },

  // 東南亞
  { name: '越南', region: '東南亞', offset: 7, dstOffset: null, stdLng: 105 },
  { name: '泰國', region: '東南亞', offset: 7, dstOffset: null, stdLng: 105 },
  { name: '新加坡', region: '東南亞', offset: 8, dstOffset: null, stdLng: 120 },
  { name: '馬來西亞', region: '東南亞', offset: 8, dstOffset: null, stdLng: 120 },
  { name: '印尼（西部）', region: '東南亞', offset: 7, dstOffset: null, stdLng: 105 },
  { name: '印尼（中部）', region: '東南亞', offset: 8, dstOffset: null, stdLng: 120 },
  { name: '菲律賓', region: '東南亞', offset: 8, dstOffset: null, stdLng: 120 },

  // 南亞
  { name: '印度', region: '南亞', offset: 5.5, dstOffset: null, stdLng: 82.5 },

  // 中東
  { name: '阿聯酋', region: '中東', offset: 4, dstOffset: null, stdLng: 60 },
  { name: '以色列', region: '中東', offset: 2, dstOffset: 3, stdLng: 30 },

  // 歐洲
  { name: '英國', region: '歐洲', offset: 0, dstOffset: 1, stdLng: 0 },
  { name: '愛爾蘭', region: '歐洲', offset: 0, dstOffset: 1, stdLng: 0 },
  { name: '葡萄牙', region: '歐洲', offset: 0, dstOffset: 1, stdLng: 0 },
  { name: '西班牙', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '法國', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '荷蘭', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '比利時', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '德國', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '瑞士', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '義大利', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '奧地利', region: '歐洲', offset: 1, dstOffset: 2, stdLng: 15 },
  { name: '芬蘭', region: '歐洲', offset: 2, dstOffset: 3, stdLng: 30 },
  { name: '希臘', region: '歐洲', offset: 2, dstOffset: 3, stdLng: 30 },
  { name: '羅馬尼亞', region: '歐洲', offset: 2, dstOffset: 3, stdLng: 30 },
  { name: '俄羅斯（莫斯科）', region: '歐洲', offset: 3, dstOffset: null, stdLng: 45 },

  // 北美
  { name: '加拿大（東岸 EST）', region: '北美', offset: -5, dstOffset: -4, stdLng: -75 },
  { name: '加拿大（西岸 PST）', region: '北美', offset: -8, dstOffset: -7, stdLng: -120 },
  { name: '美國（東岸 EST）', region: '北美', offset: -5, dstOffset: -4, stdLng: -75 },
  { name: '美國（中部 CST）', region: '北美', offset: -6, dstOffset: -5, stdLng: -90 },
  { name: '美國（西岸 PST）', region: '北美', offset: -8, dstOffset: -7, stdLng: -120 },
  { name: '墨西哥（中部）', region: '北美', offset: -6, dstOffset: -5, stdLng: -90 },

  // 大洋洲
  { name: '澳大利亞（東部 AEST）', region: '大洋洲', offset: 10, dstOffset: 11, stdLng: 150 },
  { name: '澳大利亞（西部 AWST）', region: '大洋洲', offset: 8, dstOffset: null, stdLng: 120 },
  { name: '紐西蘭', region: '大洋洲', offset: 12, dstOffset: 13, stdLng: 180 },
];

// 格式化偏移顯示
export function fmtOffset(offset) {
  const sign = offset >= 0 ? '+' : '';
  const whole = Math.floor(Math.abs(offset));
  const half = (Math.abs(offset) % 1) !== 0 ? '.5' : '';
  return `GMT${sign}${offset < 0 ? '-' : ''}${whole}${half}`;
}

// 計算真太陽時修正（分鐘）
// 以「城市的本地平太陽時」與「排盤標準時」之差
// 對中國：基準 UTC+8 = 120°E，每 1° 差 = 4 分鐘
export function calcSolarTimeCorrectionMinutes(cityLng) {
  const diff = cityLng - CHINA_STD_LNG; // 相對於 120°E 的偏差度數
  return Math.round(diff * 4); // 正數表示比北京時間快，負數表示慢
}
