import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const forbiddenTrackedNames = tracked.filter((file) =>
  /(^|\/)(\.env(?:\.|$)|\.project-config\.json$|credentials?(?:\.|\/)|secrets?(?:\.|\/))/i.test(file),
);

const privateKeyPattern = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const suspiciousAssignment = /(?:DATABASE_URL|JWT_SECRET|BAZI_DATA_ENCRYPTION_KEY|BUILT_IN_FORGE_API_KEY)\s*[:=]\s*["'](?!<|\$\{|process\.env)[^"']{12,}["']/;
const findings = [];

for (const file of tracked) {
  const fullPath = resolve(root, file);
  if (!existsSync(fullPath)) continue;
  let content;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    continue;
  }
  if (privateKeyPattern.test(content) || suspiciousAssignment.test(content)) findings.push(file);
}

const localConfig = resolve(root, ".project-config.json");
if (existsSync(localConfig)) {
  try {
    const parsed = JSON.parse(readFileSync(localConfig, "utf8"));
    const secretValues = Object.entries(parsed?.env ?? parsed?.secrets ?? parsed)
      .filter(([key, value]) => /KEY|SECRET|TOKEN|DATABASE_URL|PASSWORD/i.test(key) && typeof value === "string" && value.length >= 8)
      .map(([, value]) => value);
    for (const file of tracked) {
      const fullPath = resolve(root, file);
      if (!existsSync(fullPath)) continue;
      let content;
      try {
        content = readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }
      if (secretValues.some((value) => content.includes(value))) findings.push(file);
    }
  } catch {
    console.warn("未能解析本機專案設定；仍已完成一般私鑰與硬編碼憑證掃描。");
  }
}

const uniqueFindings = [...new Set([...forbiddenTrackedNames, ...findings])];
if (uniqueFindings.length) {
  console.error("偵測到不應公開的受追蹤檔案或疑似祕密：");
  uniqueFindings.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`開源安全掃描通過：已檢查 ${tracked.length} 個 Git 追蹤檔案。`);
