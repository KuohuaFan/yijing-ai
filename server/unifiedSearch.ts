import { hexagrams, wings } from "./yijingText";

export type CanonicalSearchHit = {
  kind: "hexagram" | "wing";
  title: string;
  excerpt: string;
  anchor: string;
  href: string;
  sourceLabel: string;
  sourceUrl: string;
  versionLabel: string;
  visibility: "public";
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function loose(value: string) {
  return compact(value).replace(/[，。；：、】【、】【「」『』（）()、]/g, "").toLocaleLowerCase();
}

function excerptFor(value: string, query: string) {
  const source = compact(value);
  const index = source.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return source.slice(0, 180);
  const start = Math.max(0, index - 42);
  const end = Math.min(source.length, index + query.length + 126);
  return `${start ? "…" : ""}${source.slice(start, end)}${end < source.length ? "…" : ""}`;
}

function hexagramAnchor(id: number, fullText: string, query: string, base: string) {
  const lines = fullText.split("\n").map((line) => line.trim()).filter(Boolean);
  const queryLoose = loose(query);
  const lineIndex = lines.findIndex((line) => loose(line).includes(queryLoose));
  const matchedLine = lineIndex >= 0 ? lines[lineIndex] : "";
  const before = lines.slice(0, Math.max(0, lineIndex)).join(" ");
  if (matchedLine.startsWith("彖曰") || before.lastIndexOf("彖曰") > before.lastIndexOf("象曰")) return `${base}-tuan`;
  if (matchedLine.startsWith("象曰") || before.lastIndexOf("象曰") >= 0) return `${base}-image`;
  if (/(初[九六]|[九六][二三四五]|上[九六])/.test(matchedLine)) return `${base}-lines`;
  return `${base}-judgment`;
}

export function searchCanonicalYijing(query: string, limit = 30): CanonicalSearchHit[] {
  const needle = compact(query);
  if (needle.length < 2) return [];
  const hits: CanonicalSearchHit[] = [];

  for (const hexagram of hexagrams) {
    const searchable = `${hexagram.name}\n${hexagram.fullText}`;
    if (!loose(searchable).includes(loose(needle))) continue;
    const anchor = hexagramAnchor(hexagram.id, hexagram.fullText, needle, hexagram.anchor);
    hits.push({
      kind: "hexagram",
      title: `${hexagram.name}・第 ${hexagram.id} 卦`,
      excerpt: excerptFor(hexagram.fullText, needle),
      anchor,
      href: `/reader/${hexagram.id}#${anchor}`,
      sourceLabel: hexagram.sourceLabel,
      sourceUrl: hexagram.sourceUrl,
      versionLabel: hexagram.versionLabel,
      visibility: "public",
    });
    if (hits.length >= limit) return hits;
  }

  for (const wing of wings) {
    const searchable = `${wing.title}\n${wing.fullText}`;
    if (!loose(searchable).includes(loose(needle))) continue;
    hits.push({
      kind: "wing",
      title: `十翼・${wing.title}${wing.chapter ? `・${wing.chapter}` : ""}`,
      excerpt: excerptFor(wing.fullText, needle),
      anchor: wing.anchor,
      href: `/library?tab=wings&wing=${encodeURIComponent(wing.id)}#${wing.anchor}`,
      sourceLabel: wing.sourceLabel,
      sourceUrl: wing.sourceUrl,
      versionLabel: wing.versionLabel,
      visibility: "public",
    });
    if (hits.length >= limit) return hits;
  }
  return hits;
}
