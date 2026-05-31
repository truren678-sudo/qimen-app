# MingPan Facts Schema v0.1

日期：2026-05-04  
對應實作：`src/core/calculateMingPan.js`、`src/core/mingpanFacts.js`

## 1. 目的

`MingPanFacts` 是命盤 App 的中間資料層。

它不負責 UI，也不直接生成命書話術，而是把 `calculateQimen(..., { chartType: '命盤' })` 的結果整理成：

- App 頁面可穩定讀取的資料
- v7.3 規則庫可判讀的 facts
- AI 解讀可引用的結構化上下文

## 2. 使用方式

```js
import { calculateMingPan } from './src/core/calculateMingPan.js';

const { result, facts, normalizedBirth } = calculateMingPan({
  calendarType: 'solar',
  birthDate: { year: 1990, month: 5, day: 12 },
  birthTime: { hour: 8, minute: 30 },
  gender: '男',
  birthLocation: {
    type: 'china',
    province: '北京市',
    city: { name: '北京市', lng: 116.4 }
  },
  isDst: false,
  useTrueSolarTime: true
});
```

## 3. Top-Level Shape

```js
{
  schemaVersion: 'mingpan-facts-v0.1',
  profile: {},
  chart: {},
  palaces: [],
  derived: {}
}
```

## 4. profile

```js
{
  gender: '男',
  solar: {
    year,
    month,
    day,
    hour,
    minute,
    weekDay
  },
  lunar: {
    year,
    month,
    day,
    isLeap
  },
  siZhu: {
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    hourGan,
    hourZhi,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    weekDay
  },
  nominalAge,
  asOfDate
}
```

`nominalAge` 目前沿用既有工具的虛歲算法：

```txt
查詢年份 - 出生年份 + 1
```

## 5. chart

```js
{
  chartType: '命盤',
  jieqiName,
  yuanName,
  yinYang,
  juNum,
  xunShou,
  kongWang,
  kongWangPalaces,
  yiMa,
  maPalace,
  fuTou,
  zhiFuXing,
  zhiShiMen,
  fuYinFanYin
}
```

說明：

- `kongWang` 是原始空亡地支，如 `戌亥`。
- `kongWangPalaces` 是空亡落宮，如 `[6]`。
- `yiMa` 是驛馬地支。
- `maPalace` 是驛馬落宮。

## 6. palaces

每個宮位：

```js
{
  num,
  name,
  fullName,
  element,
  symbol,
  personnel12: [],
  daXian,
  liuNianAges,
  symbols: {},
  harms: [],
  isKong,
  isMa,
  luck: {},
  strength: {}
}
```

### 6.1 personnel12

```js
[
  {
    name: '命宮',
    branch: '子',
    position: 'bottom',
    kind: 'person'
  }
]
```

`kind` 目前分為：

- `person`：人物宮
- `event`：事件宮
- `unknown`：未分類

### 6.2 symbols

```js
{
  shen,
  star,
  door,
  tianGan,
  tianGanExtra,
  diGan,
  diGanExtra,
  yinGan,
  extraStar
}
```

這一層保留專業符號，用於專業盤面、規則判讀、AI 引用依據。

### 6.3 harms

```js
[
  { type: '門迫', source: 'door' },
  { type: '墓', source: 'tianGan' },
  { type: '空亡', source: 'kongWang' }
]
```

目前來源：

- `door`
- `tianGan`
- `tianGanExtra`
- `diGan`
- `diGanExtra`
- `kongWang`

四害判定仍沿用現有 `qimen.js` 的排盤結果。

### 6.4 luck

依 v7.3 模組 X2 計算幸運指數。

```js
{
  score: 70,
  details: [
    { symbol: '太陰', category: '八神', points: 20 },
    { symbol: '開門', category: '八門', points: 40 },
    { symbol: '戊', category: '地盤干', points: 10 }
  ],
  method: 'v7.3-x2'
}
```

加分規則：

| 類別 | 分數 | 吉符號 |
|---|---:|---|
| 八神 | 20 | 值符、太陰、六合、九天 |
| 九星 | 20 | 天輔、天心、天任 |
| 八門 | 40 | 開門、休門、生門 |
| 天盤干 | 10 | 乙、丙、丁、戊 |
| 地盤干 | 10 | 乙、丙、丁、戊 |

### 6.5 strength

依 v7.3 模組 K 做第一版保守判定。

```js
{
  level: '旺宮',
  method: 'v7.3-k-heuristic'
}
```

可能值：

- `大旺宮`
- `旺宮`
- `小衰宮`
- `衰宮`
- `大衰宮`

注意：v7.3 明確說旺衰不是機械一對一判定，因此目前標記為 `heuristic`。後續如果人工規則更細，可替換這一層。

## 7. derived

```js
{
  mingGong,
  shenGong,
  platformGong,
  careerPalace,
  wealthPalace,
  spousePalace,
  currentDaXian,
  currentYearPalace,
  luckRanking
}
```

### 7.1 核心宮位

```js
mingGong: { num, name }
shenGong: { num, name, stem }
platformGong: { num, name, stem }
careerPalace: { num, name }
wealthPalace: { num, name }
spousePalace: { num, name }
```

目前規則：

- `mingGong`：十二人事宮中的命宮。
- `shenGong`：日干所在天盤宮。
- `platformGong`：時干所在天盤宮；若時干為甲，使用旬首隱干。

### 7.2 currentDaXian

```js
{
  num,
  name,
  range: { start, end }
}
```

依 `nominalAge` 找目前所在大限宮。

### 7.3 currentYearPalace

```js
{
  num,
  name,
  nominalAge
}
```

依 `liuNianAges` 找目前流年落宮。現有排盤結果只列 1-70 歲，因此超過範圍時可能為 `null`。

### 7.4 luckRanking

```js
{
  top3: [],
  bottom3: []
}
```

排除中宮後，依幸運指數排序。

## 8. normalizedBirth

`calculateMingPan` 另外回傳 `normalizedBirth`，用於記錄出生時間如何被轉換。

```js
{
  input,
  normalized,
  calendarType,
  isDst,
  useTrueSolarTime,
  location,
  adjustments: []
}
```

`adjustments` 可能包含：

- `lunar-to-solar`
- `overseas-to-utc8`
- `china-dst-minus-60-minutes`
- `true-solar-time`

這一層是日後 debug 排盤差異的關鍵。

## 9. 下一版待補

- 更完整的身宮、平台宮特殊規則校驗。
- v7.3 模組 H5 天干兩兩組合格局。
- 宮位生剋關係 facts。
- 大限轉太極後的生剋 facts。
- 流年應期 facts。
- AI prompt context builder。

