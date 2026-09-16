# 安全政策

## 支援版本

目前只維護 `main` 分支最新版本。歷史 checkpoint 與 fork 可能缺少後續安全修補。

## 私下回報漏洞

請使用 GitHub repository 的 **Security → Report a vulnerability** 私人回報功能。不要在公開 issue 貼出 API key、cookie、資料庫網址、加密金鑰、真實生辰資料、使用者附件或可重現的攻擊 payload。

回報請包含受影響版本、重現步驟、影響範圍、建議修正及您是否已接觸任何真實資料。維護者會先確認問題，再決定修補、撤銷 token、輪替金鑰或通知受影響使用者的必要性。

## 安全邊界

本倉庫不提供 production secrets。Fork 維護者必須自行建立資料庫、OAuth、物件儲存、AI 服務與 `BAZI_DATA_ENCRYPTION_KEY`，並遵守最小權限與定期輪替原則。加密金鑰遺失將使既有密文無法還原；任意更換金鑰前必須先設計版本化遷移。
