import type { ChatRecord, ResearchCitation } from "@/lib/chatHistory";
import { BRAND, resolveBrandAssetUrl } from "@/lib/brand";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function dateLabel(value: number) {
  return new Date(value).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" });
}

type CitationFootnote = ResearchCitation;

function legacyCitationFootnotes(record: ChatRecord): CitationFootnote[] {
  const seen = new Set<string>();
  const footnotes: CitationFootnote[] = [];
  for (const message of record.messages) {
    if (message.role !== "assistant") continue;
    const anchors = message.content.match(/#[a-z]+(?:-\d+)+/gi) ?? [];
    for (const anchor of anchors) {
      if (seen.has(anchor)) continue;
      seen.add(anchor);
      const at = message.content.indexOf(anchor);
      const excerpt = message.content.slice(Math.max(0, at - 72), at + 96).replace(/\s+/g, " ").trim();
      footnotes.push({
        label: "舊版導讀錨點",
        anchor,
        excerpt: excerpt || "導讀回應中的原典定位。",
        sourceLabel: "Project Gutenberg #25501《易經》電子文本",
        sourceUrl: "https://www.gutenberg.org/ebooks/25501",
        versionLabel: "2008 發布、2021 更新；舊版本機紀錄未保存逐筆結構化引文。",
      });
    }
  }
  return footnotes;
}

function citationFootnotes(record: ChatRecord) {
  return record.citations?.length ? record.citations : legacyCitationFootnotes(record);
}

export function recordToMarkdown(record: ChatRecord) {
  const citations = citationFootnotes(record);
  const lines = [
    `# ${record.title}`,
    "",
    `- 匯出日期：${dateLabel(Date.now())}`,
    `- 建立日期：${dateLabel(record.createdAt)}`,
    `- 專案：${record.project}`,
    `- 標籤：${(record.tags ?? []).map((tag) => `#${tag}`).join("、") || "未設定"}`,
    "",
  ];
  if (record.divination) {
    lines.push("## 起卦快照", "", `- 所問：${record.divination.question || "未填寫問題"}`, `- 本卦：${record.divination.originalName}（第 ${record.divination.originalId} 卦）`, `- 之卦：${record.divination.transformedName}（第 ${record.divination.transformedId} 卦）`, `- 變爻：${record.divination.movingLines.length ? record.divination.movingLines.join("、") : "無"}`, `- 六爻（下至上）：${record.divination.lineValues.join("、")}`, "");
  }
  lines.push("## 對話與導讀", "");
  record.messages.forEach((message) => lines.push(`### ${message.role === "user" ? "你所問" : "觀易導讀"}`, "", message.content, ""));
  if (record.attachments?.length) {
    lines.push("## 附件", "");
    record.attachments.forEach((attachment) => lines.push(`- ${attachment.fileName}（${attachment.kind}，${attachment.storageUrl}）`, attachment.transcript ? `  - 語音逐字稿：${attachment.transcript}` : ""));
  }
  lines.push("", "## 引文與來源腳註", "", ...citations.map((citation, index) => `${index + 1}. ${citation.label}：${citation.excerpt}\n   - 來源：${citation.sourceLabel}\n   - 版本：${citation.versionLabel}\n   - 錨點：#${citation.anchor}\n   - 連結：${citation.sourceUrl}`), "> 本文件為《易經》文本研讀與反思紀錄，不構成預測、醫療、法律或投資意見。", "");
  return lines.join("\n");
}

export function downloadTextFile(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadRecord(record: ChatRecord, format: "markdown" | "json") {
  const stem = record.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "yijing-record";
  if (format === "json") return downloadTextFile(`${stem}.json`, JSON.stringify(record, null, 2), "application/json;charset=utf-8");
  downloadTextFile(`${stem}.md`, recordToMarkdown(record), "text/markdown;charset=utf-8");
}

export function recordToWordHtml(record: ChatRecord) {
  const documentBody = recordToMarkdown(record)
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith("> ")) return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
      return line ? `<p>${escapeHtml(line)}</p>` : "";
    })
    .join("");
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${escapeHtml(record.title)}</title><style>body{font-family:"Noto Serif TC","Songti TC",serif;line-height:1.75;color:#1f2a25;margin:36px}.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.brand img{width:52px;height:52px;border-radius:50%}.brand strong{display:block;font-size:18px}.brand small{color:#815924}h1{font-size:28px;border-bottom:2px solid #b88c48;padding-bottom:12px}h2{font-size:20px;color:#815924;margin-top:28px}h3{font-size:15px;color:#6c593e;margin-top:20px}p{white-space:pre-wrap}blockquote{border-left:3px solid #be9858;padding-left:14px;color:#555f56}</style></head><body><div class="brand"><img src="${escapeHtml(resolveBrandAssetUrl())}" alt="${escapeHtml(BRAND.name)} Logo"/><span><strong>${escapeHtml(BRAND.title)}</strong><small>${escapeHtml(BRAND.tagline)}</small></span></div>${documentBody}</body></html>`;
}

export function downloadRecordWord(record: ChatRecord) {
  const stem = record.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "yijing-record";
  downloadTextFile(`${stem}.doc`, recordToWordHtml(record), "application/msword;charset=utf-8");
}

function hexagramMarkup(name: string, values: number[], movingLines: number[], transformed: boolean) {
  const calculated = values.map((value, index) => movingLines.includes(index + 1) ? (value === 6 ? 7 : value === 9 ? 8 : value) : value);
  const lines = (transformed ? calculated : values).slice().reverse();
  return `<figure class="hexagram"><figcaption>${transformed ? "之卦" : "本卦"}・${escapeHtml(name)}卦</figcaption><div class="hex-lines">${lines.map((value, reverseIndex) => {
    const position = 6 - reverseIndex;
    const yang = value === 7 || value === 9;
    const moving = movingLines.includes(position) && !transformed;
    return `<div class="hex-line ${yang ? "yang" : "yin"} ${moving ? "moving" : ""}"><i></i><i></i></div>`;
  }).join("")}</div></figure>`;
}

export function recordToPrintHtml(record: ChatRecord) {
  const body = recordToMarkdown(record).split("\n").map((line) => {
    if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
    if (line.startsWith("- ")) return `<p class="meta">${escapeHtml(line.slice(2))}</p>`;
    if (line.startsWith("> ")) return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
    return line ? `<p>${escapeHtml(line)}</p>` : "";
  }).join("");
  const snapshot = record.divination;
  const diagrams = snapshot ? `<section class="diagram-grid">${hexagramMarkup(snapshot.originalName, snapshot.lineValues, snapshot.movingLines, false)}${hexagramMarkup(snapshot.transformedName, snapshot.lineValues, snapshot.movingLines, true)}</section>` : "";
  const citations = citationFootnotes(record);
  const citationList = citations.map((citation) => `<li><strong>${escapeHtml(citation.label)}</strong>：${escapeHtml(citation.excerpt)}<br/>來源：${escapeHtml(citation.sourceLabel)}<br/>版本：${escapeHtml(citation.versionLabel)}<br/>錨點：#${escapeHtml(citation.anchor)}<br/>連結：${escapeHtml(citation.sourceUrl)}</li>`).join("");
  const footnotes = `<section class="footnotes"><h2>卦象與引文腳註</h2>${snapshot ? `<p>本卦：${escapeHtml(snapshot.originalName)}卦（第 ${snapshot.originalId} 卦）；之卦：${escapeHtml(snapshot.transformedName)}卦（第 ${snapshot.transformedId} 卦）。變爻：${snapshot.movingLines.length ? `第 ${snapshot.movingLines.join("、")} 爻` : "無"}；六爻由下至上：${snapshot.lineValues.join("、")}。</p>` : ""}<ol>${citationList}</ol></section>`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"/><title>${escapeHtml(record.title)}｜研讀報告</title><style>body{font-family:"Noto Serif TC","Songti TC",serif;color:#1f2a25;max-width:760px;margin:42px auto;padding:0 28px;line-height:1.8}.brand{display:flex;align-items:center;gap:12px;margin-bottom:26px}.brand img{width:54px;height:54px;border-radius:50%}.brand strong{display:block;font-size:18px}.brand small{color:#815924}h1{font-size:30px;border-bottom:2px solid #b88c48;padding-bottom:15px}h2{font-size:20px;color:#815924;margin-top:30px}h3{font-size:15px;letter-spacing:.08em;color:#6c593e;margin-top:24px}p{white-space:pre-wrap}p.meta{font-size:13px;color:#646d65;margin:4px 0}blockquote{margin:22px 0;padding:12px 16px;border-left:3px solid #be9858;background:#faf7f0;color:#555f56}.diagram-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:26px 0;padding:20px;border:1px solid #d8caa7;background:#fcf8ef}.hexagram{margin:0;text-align:center}.hexagram figcaption{font-size:14px;font-weight:700;color:#6c593e}.hex-lines{display:grid;gap:7px;margin:16px auto 0;width:120px}.hex-line{display:flex;gap:12px;height:8px}.hex-line i{display:block;flex:1;background:#203027}.hex-line.yang i:last-child{display:none}.hex-line.moving i{background:#b77a2c}.footnotes{margin-top:34px;border-top:1px solid #d8caa7;font-size:12px;color:#5f655f}.footnotes ol{padding-left:20px}@media print{body{margin:0;max-width:none}.diagram-grid{break-inside:avoid}}</style></head><body><div class="brand"><img src="${escapeHtml(resolveBrandAssetUrl())}" alt="${escapeHtml(BRAND.name)} Logo"/><span><strong>${escapeHtml(BRAND.title)}</strong><small>${escapeHtml(BRAND.tagline)}</small></span></div>${body}${diagrams}${footnotes}<script>window.addEventListener('load',()=>window.print())<\/script></body></html>`;
}

export function openRecordPrintView(record: ChatRecord) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return false;
  popup.document.write(recordToPrintHtml(record));
  popup.document.close();
  return true;
}

export function recordSharePayload(record: ChatRecord, includesAttachments: boolean): Record<string, unknown> {
  const snapshot: ChatRecord = { ...record, attachments: includesAttachments ? record.attachments : [] };
  return JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
}
