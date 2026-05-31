# MingPan Overview Interpreter v0.1

日期：2026-05-04  
對應實作：`src/interpreter/interpretOverview.js`

## 1. 目的

`interpretOverview` 是第一個命盤解讀層。

它接收 `MingPanFacts`，輸出面向一般用戶的命盤總覽，用於新 App 的結果首頁。

這一版刻意不接 AI，先用 deterministic 模板完成：

- 命盤整體結構摘要
- 高分宮位提示
- 需留意宮位提示
- 當前大限摘要
- 可追溯的 evidence

## 2. 使用方式

```js
import { calculateMingPan } from './src/core/calculateMingPan.js';
import { interpretOverview } from './src/interpreter/interpretOverview.js';

const { facts } = calculateMingPan({
  calendarType: 'solar',
  birthDate: { year: 1990, month: 5, day: 12 },
  birthTime: { hour: 8, minute: 30 },
  gender: '男'
});

const overview = interpretOverview(facts);
console.log(overview.text);
```

## 3. Output Shape

```js
{
  schemaVersion: 'mingpan-overview-v0.1',
  tone: 'user-facing',
  policy: {},
  headline,
  text,
  cards: {
    highlights: [],
    cautions: [],
    currentStage: {}
  },
  evidence: {}
}
```

## 4. policy

```js
{
  avoidsAbsoluteClaims: true,
  includesActionableCautions: true,
  source: 'v7.3 facts + v1.0.1 translation principles'
}
```

這一層遵守 v1.0.1 翻譯器原則：

- 不用「一定」「必然」「注定」。
- 不把凶象說成吉象。
- 指出風險時附帶調整方向。
- 先用生活語言，再保留 evidence 給專業層。

## 5. cards.highlights

```js
[
  {
    palace,
    title,
    body
  }
]
```

來源：

- `facts.derived.luckRanking.top3`
- 再回查完整宮位 facts

用途：

- App 首頁的「你的三個可用資源」
- 命書第一段的核心強項

## 6. cards.cautions

```js
[
  {
    palace,
    title,
    body
  }
]
```

選取邏輯：

1. 優先選四害疊加較多的宮位。
2. 再補幸運指數較低的宮位。
3. 最多三個。

用語原則：

- 不說「這個宮位很差」。
- 改說「需要更有策略地處理」。
- 若有四害，指出四害名稱，但不恐嚇。

## 7. cards.currentStage

```js
{
  title,
  body,
  evidence
}
```

來源：

- `facts.derived.currentDaXian`
- 對應宮位的 `personnel12`
- 對應宮位的 `strength` 與 `harms`

用途：

- App 首頁的「你目前的人生階段」
- 大限頁的摘要入口

## 8. headline

`headline` 是命盤整體結構的一句話標籤。

目前規則：

- 有伏吟：偏向長線累積、慢慢打底
- 有反吟：帶有變動感，需要在起伏中調整節奏
- 空亡宮位多：有些領域容易出現落差感，需要先校準期待
- 高低分都明顯：強弱分明，適合把力氣放在真正有回報的位置
- 高分宮位多：可用資源不少，適合主動建立自己的節奏
- 其他：穩中帶選擇，重點在於看懂不同領域的投入順序

## 9. 待補

- 接入 v7.3 模組 H5 的格局專名。
- 加入命財官專項摘要。
- 加入大限轉太極後的五種生剋關係。
- 加入可配置語氣：溫和版、理性版、行動版。
- 將 `text` 拆成更細的 UI blocks，減少前端解析成本。

