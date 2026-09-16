# 環境變數參考

請在部署平台的 Secrets 介面設定下列變數，禁止把真實值提交到 Git。

```text
DATABASE_URL=<mysql-or-tidb-connection-string>
JWT_SECRET=<high-entropy-session-secret>
BAZI_DATA_ENCRYPTION_KEY=<32-byte-high-entropy-key>
VITE_APP_ID=<oauth-app-id>
OAUTH_SERVER_URL=<oauth-server-url>
VITE_OAUTH_PORTAL_URL=<oauth-portal-url>
BUILT_IN_FORGE_API_URL=<server-ai-api-url>
BUILT_IN_FORGE_API_KEY=<server-ai-api-key>
VITE_FRONTEND_FORGE_API_URL=<frontend-platform-api-url>
VITE_FRONTEND_FORGE_API_KEY=<frontend-platform-api-key>
VITE_APP_TITLE=易經 AI｜觀象・卜卦
VITE_APP_LOGO=https://your-domain.example/path/to/logo.png
```

前端變數會進入瀏覽器 bundle；不得把真正需要保密的憑證設為 `VITE_*`。若自行部署，應重新檢查平台提供的 proxy、OAuth callback、cookie SameSite／Secure 及跨網域設定。
