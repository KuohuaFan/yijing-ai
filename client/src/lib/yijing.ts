export type HexagramSummary = { id: number; name: string; lines: string; anchor: string };

export type Citation = {
  label: string;
  anchor: string;
  excerpt: string;
  sourceLabel: string;
  sourceUrl: string;
  versionLabel: string;
};

export const lineLabels = ["初", "二", "三", "四", "五", "上"];

export function lineValueLabel(value: number, index: number) {
  const position = lineLabels[index];
  if (index === 0) return value === 6 || value === 8 ? "初六" : "初九";
  if (index === 5) return value === 6 || value === 8 ? "上六" : "上九";
  return `${value === 6 || value === 8 ? "六" : "九"}${position}`;
}

export function lineMeta(value: number) {
  return {
    label: value === 6 ? "老陰" : value === 7 ? "少陽" : value === 8 ? "少陰" : "老陽",
    yin: value === 6 || value === 8,
    moving: value === 6 || value === 9,
  };
}

export function textSections(text: string, name: string, anchorBase: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const judgment = lines.find((line) => line.startsWith(`${name}：`));
  const lineTexts = lines.filter((line) => /^(初[六九]|[六九][二三四五]|上[六九])：/.test(line));
  const tuanIndex = lines.findIndex((line) => line.startsWith("彖曰"));
  const imageIndexes = lines.map((line, index) => (line.startsWith("象曰") ? index : -1)).filter((index) => index >= 0);
  const bigImage = imageIndexes.length ? lines[imageIndexes[0]] : undefined;
  const smallImages = imageIndexes.slice(1).map((index) => lines[index]);
  const tuanEnd = imageIndexes[0] ?? lines.length;
  const tuan = tuanIndex >= 0 ? lines.slice(tuanIndex, tuanEnd).join("\n") : "";

  return [
    { title: "卦辭", anchor: `${anchorBase}-judgment`, content: judgment ?? "" },
    { title: "動爻爻辭", anchor: `${anchorBase}-lines`, content: lineTexts.join("\n") },
    { title: "彖傳", anchor: `${anchorBase}-tuan`, content: tuan },
    { title: "大象", anchor: `${anchorBase}-image`, content: bigImage ?? "" },
    { title: "小象", anchor: `${anchorBase}-small-images`, content: smallImages.join("\n") },
  ].filter((section) => section.content.trim());
}
