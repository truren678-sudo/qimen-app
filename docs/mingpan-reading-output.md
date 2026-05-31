# MingPan Reading Output v0.1

日期：2026-05-05  
對應實作：`src/interpreter/generateMingPanReading.js`

## 1. 目的

`generateMingPanReading()` 是用戶版 App 的統一解讀出口。

它接收 `MingPanFacts`，一次生成：

- App 首頁可用的專題 sections
- 十二宮卡片 palaceReadings
- 可匯出的 Markdown 報告 reportMarkdown
- policyCheck，用於檢查是否出現禁用詞

## 2. 使用方式

```js
import { calculateMingPan } from '../src/core/calculateMingPan.js';
import { generateMingPanReading } from '../src/interpreter/generateMingPanReading.js';

const { facts } = calculateMingPan(input, {
  asOfDate: new Date('2026-05-05T00:00:00+08:00')
});

const reading = generateMingPanReading(facts, {
  displayName: '小明',
  generatedAt: '2026-05-05T12:00:00+08:00'
});
```

## 3. Output Shape

```js
{
  schemaVersion: 'mingpan-reading-v0.1',
  factsSchemaVersion: 'mingpan-facts-v0.1',
  profileTitle,
  generatedAt,
  sections: [],
  palaceReadings: [],
  sourceReadings: {},
  policyCheck: {},
  reportMarkdown
}
```

## 4. sections

`sections` 是 App 首頁/報告主要分區。

目前包含：

| id | title | 來源 |
|---|---|---|
| overview | 命盤總覽 | `interpretOverview` |
| career-wealth | 事業財富 | `interpretCareerWealth` |
| current-daxian | 當前大限 | `interpretCurrentDaXian` |
| relationship | 婚戀感情 | `interpretRelationship` |
| talent | 個性天賦 | `interpretTalent` |
| health-risk | 身心風險提醒 | `interpretHealth` |
| annual-timing | 年度提示 | `interpretAnnualTiming` |

每個 section：

```js
{
  id,
  title,
  schemaVersion,
  text,
  cards,
  evidence
}
```

## 5. palaceReadings

`palaceReadings` 是十二宮卡片。

順序：

```txt
命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、交友、事業、田宅、福德、父母
```

每一項由 `interpretPalace(facts, 宮名)` 產生。

## 6. reportMarkdown

`reportMarkdown` 是第一版文字報告，可用於：

- 複製分享
- AI 上下文
- 後續 PDF/圖片報告生成
- 付費命書雛形

包含：

- 命盤總覽
- 事業財富
- 當前大限
- 婚戀感情
- 個性天賦
- 身心風險提醒
- 年度提示
- 十二宮速覽
- 依據與邊界

## 7. policyCheck

```js
{
  ok: true,
  violations: []
}
```

目前檢查 `promptPolicy` 中的禁用詞。

注意：這不是完整合規審核，只是第一道機械檢查。

## 8. 下一步

- 接入 UI prototype。
- 加入報告長度：30 秒版 / 2 分鐘版 / 完整版。
- 加入語氣模式：溫和版 / 理性版 / 行動版。
- 加入 AI chat context builder。
- 加入 H5 天干格局專名與特殊格局標籤。

