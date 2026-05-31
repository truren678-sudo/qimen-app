# MingPan Interpreters v0.1

日期：2026-05-04  
對應實作：`src/interpreter/`

## 1. 已實作模組

### 1.1 `interpretOverview`

用途：命盤首頁總覽。

輸出：

- 整體命盤結構
- 三個可用資源
- 三個需留意宮位
- 當前大限摘要

來源：

- `MingPanFacts`
- v7.3 X2/K/R
- v1.0.1 翻譯器原則

### 1.2 `interpretCareerWealth`

用途：事業財帛專項。

輸出：

- 財格 / 官格 / 命財官平衡型
- 命宮、事業宮、財帛宮三方摘要
- 事業符號訊號
- 當前大限對事業與財帛的生剋建議
- 財務與事業風險提醒

來源：

- v7.3 模組 T 事業財帛專論
- v7.3 模組 M 生剋關係
- v7.3 模組 R 大限轉太極
- v1.0.1 第 11 章事業財富話術

### 1.3 `interpretCurrentDaXian`

用途：當前十年大限解讀。

輸出：

- 當前大限宮位
- 大限核心課題
- 五種生剋關係分組
- 機會點
- 挑戰點
- 大限與流年的判讀分工提醒

來源：

- v7.3 模組 R
- v7.3 模組 S
- v7.3 模組 M

### 1.4 `interpretPalace`

用途：十二宮單宮卡片。

輸出：

- 宮位主題
- 幸運指數
- 旺衰評定
- 八神、九星、八門、天干摘要
- 四害狀態
- 行動建議

來源：

- v7.3 模組 C/D
- v7.3 模組 E/F/G/H
- v7.3 模組 I/K/X2

### 1.5 `promptPolicy`

用途：後續 AI 問答的安全與風格邊界。

包含：

- `MINGPAN_PROMPT_POLICY`
- `buildMingPanSystemPrompt`
- `validateMingPanResponseText`

核心原則：

- 不跨命理系統
- 不絕對化
- 不恐嚇
- 不作醫療、法律、投資保證
- 風險提示必須附帶行動建議

### 1.6 `interpretRelationship`

用途：婚戀感情專項。

輸出：

- 命宮、夫妻宮、財帛宮、子女宮合參
- 日干合干的配偶符號
- 三奇乙丙丁的桃花/戀愛訊號
- 當前大限與夫妻宮、子女宮的生剋關係
- 感情界線與承諾建議

來源：

- v7.3 模組 U 婚戀感情專論
- v7.3 模組 M 生剋關係
- v7.3 模組 R 大限轉太極

### 1.7 `interpretTalent`

用途：個性天賦專項。

輸出：

- 命宮：先天個性
- 身宮：後天追求方向
- 福德宮：興趣、天賦與領悟力
- 父母宮：學習力與吸收能力
- 平台宮：才華落地舞台

來源：

- v7.3 模組 W 個性天賦專論
- v7.3 模組 D/E/F/G/H

### 1.8 `interpretHealth`

用途：健康與身心風險提醒。

輸出：

- 命宮、疾厄宮、福德宮、子女宮合參
- 健康/壓力訊號
- 身心節奏建議
- 醫療專業邊界提示

注意：此模組不做疾病診斷，只做生活節奏與風險管理提醒。

來源：

- v7.3 模組 V 疾病傷災專論
- v7.3 模組 M 生剋關係
- v1.0.1 合規原則

### 1.9 `interpretAnnualTiming`

用途：流年應期提示。

輸出：

- 當前年份 / 指定虛歲
- 流年走到的宮位
- 與當前大限宮的生剋關係
- 對宮提醒
- 年度行動建議

核心原則：

> 大限斷事件，流年定應期。

來源：

- v7.3 模組 S 流年應期
- v7.3 模組 R 大限
- v7.3 模組 M 生剋

### 1.10 `generateMingPanReading`

用途：統一解讀出口。

輸出：

- `sections`：App 首頁與專題頁可用的主要分區
- `palaceReadings`：十二宮卡片
- `sourceReadings`：各 interpreter 原始輸出
- `policyCheck`：禁用詞檢查
- `reportMarkdown`：可匯出的文字報告

來源：

- 所有已實作 deterministic interpreters

## 2. 建議使用方式

```js
import { calculateMingPan } from '../src/core/calculateMingPan.js';
import { interpretOverview } from '../src/interpreter/interpretOverview.js';
import { interpretCareerWealth } from '../src/interpreter/interpretCareerWealth.js';
import { interpretCurrentDaXian } from '../src/interpreter/interpretDaXian.js';
import { interpretPalace } from '../src/interpreter/interpretPalace.js';
import { interpretRelationship } from '../src/interpreter/interpretRelationship.js';
import { interpretTalent } from '../src/interpreter/interpretTalent.js';
import { interpretHealth } from '../src/interpreter/interpretHealth.js';
import { interpretAnnualTiming } from '../src/interpreter/interpretAnnualTiming.js';
import { generateMingPanReading } from '../src/interpreter/generateMingPanReading.js';

const { facts } = calculateMingPan(input);

const overview = interpretOverview(facts);
const career = interpretCareerWealth(facts);
const daXian = interpretCurrentDaXian(facts);
const spouse = interpretPalace(facts, '夫妻');
const relationship = interpretRelationship(facts);
const talent = interpretTalent(facts);
const health = interpretHealth(facts);
const annual = interpretAnnualTiming(facts);
const reading = generateMingPanReading(facts, { displayName: '命主' });
```

## 3. 設計原則

第一版全部採 deterministic interpreter，不直接依賴 AI。

原因：

- 可測試
- 可追溯
- 可控風險
- 方便日後接 AI 時作為 evidence

AI 的角色應是「翻譯與對話」，不是「自行判盤」。

## 4. 下一版待補

- v7.3 H5 天干格局專名
- v1.0.1 三種客戶模式語氣切換
- 圖片/報告輸出格式
- AI chat context builder
- 新 App UI prototype
