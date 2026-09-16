<div align="center">
  <img src="https://yijingai.manus.space/manus-storage/yijing-ai-logo_02eb33ab.png" width="112" height="112" alt="易經 AI 紫色白鳥 Logo" />

  # 易經 AI｜觀象・卜卦

  **以《易經》原典、卦象結構與來源明示的 AI 導讀，建立可追溯的數位研讀與反思工作台。**

  [正式全端站](https://yijingai.manus.space) · [GitHub Pages 展示](https://kuohuafan.github.io/yijing-ai/) · [版本與來源](https://yijingai.manus.space/sources)
</div>

## 專案定位

《易經 AI》是一個以 **原典優先、規則計算、來源可追溯、隱私預設與非預測性安全邊界** 為核心的全端開源專案。平台整合三錢起卦、六十四卦與十翼閱讀、AI 六段導讀、八字／流年研究、詩籤文本研究、個人研讀紀錄、註解、搜尋及可撤銷分享。

> 本專案用於文本研究、文化理解與自我反思，不構成吉凶預測、醫療、法律、投資、保險或其他重大決策意見。

## 主要功能

| 模組 | 功能 | 安全與可追溯設計 |
|---|---|---|
| 易經起卦 | 三錢法六爻、本卦、變爻、之卦、歷程保存 | 規則引擎計算，不由 LLM 自行決定卦象 |
| 原典閱讀 | 六十四卦、卦爻辭、彖傳、象傳與十翼 | 顯示版本、來源、段落錨點與外部連結 |
| AI 導讀 | 固定六段文本導讀與結構反思 | 高風險問題轉為文本閱讀，不提供決策結論 |
| 八字／流年 | 四柱、節氣月、子初／子正、大運時間軸 | 明示計算慣例、規則版本與真太陽時狀態 |
| 私密資料 | 生辰加密保存、載入、刪除、遮罩分享 | 預設不保存；另行同意；公開快照排除生辰資料 |
| 詩籤研究 | 使用者輸入原文、籤號、宮廟／系統、來源與版本 | 不預載未授權解籤；固定六段研究導讀與安全轉向 |
| 研讀交付 | Markdown、JSON、Word、PDF、複製與可撤銷分享 | 引文逐筆附來源、版本、錨點與連結 |
| 統一搜尋 | 原典、十翼及本人可見研讀資料 | 私人內容僅本人可見，結果可跳至段落錨點 |

## 技術架構

| 層級 | 技術 |
|---|---|
| 前端 | React 19、Vite 7、TypeScript、Tailwind CSS 4、shadcn/ui、Wouter |
| API | Express 4、tRPC 11、Zod、SuperJSON |
| 資料 | Drizzle ORM、MySQL／TiDB |
| 身分與儲存 | Manus OAuth、S3 相容物件儲存 |
| AI | 伺服器端受限 LLM 導讀、確定性回退 |
| 曆法 | `lunar-javascript` 1.7.7；慣例與版本回顯 |
| 品質 | Vitest、TypeScript、Vite production build |

```text
client/          React 前端、頁面、元件、匯出工具
server/          Express、tRPC、規則引擎、AI 導讀與資料存取
drizzle/         Schema、關聯與 SQL migration
shared/          共用型別與常數
docs/            GitHub Pages 靜態展示頁
.github/         CI 與 Pages 自動部署流程
```

## 本機開發

### 系統需求

請使用 **Node.js 22+** 與 **pnpm 10+**，並準備 MySQL／TiDB 資料庫。完整 AI、OAuth、S3、通知與語音能力需要相應服務憑證；沒有這些憑證時，部分單元測試與純規則模組仍可獨立執行。

```bash
git clone https://github.com/KuohuaFan/yijing-ai.git
cd yijing-ai
pnpm install
pnpm check
pnpm test
pnpm dev
```

### 環境變數

請在部署平台的 Secrets／Environment Variables 介面設定，**不要提交 `.env`、金鑰或資料庫網址**。

| 變數 | 用途 | 必要性 |
|---|---|---|
| `DATABASE_URL` | MySQL／TiDB 連線 | 全端資料功能必需 |
| `JWT_SECRET` | 登入工作階段簽章 | OAuth 必需 |
| `VITE_APP_ID`、`OAUTH_SERVER_URL`、`VITE_OAUTH_PORTAL_URL` | Manus OAuth | 登入功能必需 |
| `BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY` | 伺服器端 AI／平台 API | AI 導讀必需 |
| `VITE_FRONTEND_FORGE_API_URL`、`VITE_FRONTEND_FORGE_API_KEY` | 前端平台整合 | 依部署環境 |
| `BAZI_DATA_ENCRYPTION_KEY` | 生辰資料 AES-GCM 加密 | 八字私密保存必需；建議 32 bytes 高熵金鑰 |
| `VITE_APP_TITLE`、`VITE_APP_LOGO` | 網站品牌設定 | 建議設定 |

資料庫遷移採 schema-first 流程：先更新 `drizzle/schema.ts`，產生並審閱 migration，再於目標資料庫執行。請勿在不理解影響時直接執行破壞性 SQL。

## 常用指令

| 指令 | 用途 |
|---|---|
| `pnpm dev` | 啟動 React／Express 開發服務 |
| `pnpm check` | TypeScript 型別檢查 |
| `pnpm test` | 執行 Vitest 測試 |
| `pnpm build` | 建立前端與伺服器 production bundle |
| `pnpm start` | 啟動 production bundle |

## GitHub Pages 與正式站的差異

GitHub Pages 只能提供靜態檔案，不能執行本專案的 Express、tRPC、OAuth、AI、資料庫、S3、加密保存或可撤銷分享。因此 Pages 版本是**開源專案展示與文件入口**；完整功能請使用 [正式全端站](https://yijingai.manus.space)。

| 能力 | GitHub Pages | 正式全端站 |
|---|---:|---:|
| 專案介紹、功能與安全邊界 | 是 | 是 |
| 查看原始碼與部署文件 | 是 | 是 |
| 起卦、AI 導讀、登入、資料庫 | 否 | 是 |
| 八字加密保存與遮罩分享 | 否 | 是 |
| 詩籤 AI 研究與可撤銷分享 | 否 | 是 |

## 資料、隱私與安全

生辰資料屬敏感資料。未經明示保存同意時，八字排盤只在目前工作階段使用；保存後，日期、時間、時區與地點以伺服器端金鑰加密。分享快照只允許白名單結構資料，並排除出生日期、出生時間、時區、地點及不必要的推論參數。

開源倉庫不包含 production secrets、使用者資料、附件、資料庫內容或平台內部憑證。發現安全問題時，請依 [SECURITY.md](SECURITY.md) 私下回報，不要建立公開 issue 揭露敏感細節。

## 文本、來源與權利邊界

《易經》公開文本、數位化版本與注家內容具有不同權利狀態。專案以來源卡、版本欄位、段落錨點及授權查核文件區分可直接使用、需取得許可及僅供校勘參照的材料。詩籤首版只處理使用者有權提供的原文或具明示再利用條件的資料，不批次轉載未授權的現代解籤內容。

## 貢獻

歡迎提交可重現的 bug、測試、文件、無障礙改善與具授權依據的文本資料。請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)、[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 與 [SECURITY.md](SECURITY.md)。

## 授權

原始碼依 [MIT License](LICENSE) 開放。使用者提供的紫色白鳥 Logo、專案名稱與品牌識別**不因程式碼採 MIT 授權而自動授權商標或品牌使用**；詳見 [TRADEMARKS.md](TRADEMARKS.md)。第三方文本、字型、套件與資料仍受其各自授權條款約束。

## 專案負責人

**Dr.Fan／KuohuaFan**。本專案持續開發中；功能、資料來源與安全規則會隨查核與測試逐步更新。
