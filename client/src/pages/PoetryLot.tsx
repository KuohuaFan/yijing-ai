import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookMarked, ClipboardCopy, Facebook, FileDown, FileText, Instagram, Link2, LockKeyhole, Save, Share2, Sparkles, Undo2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChatRecord, ResearchCitation } from "@/lib/chatHistory";
import { downloadRecordWord, openRecordPrintView, recordSharePayload } from "@/lib/recordExport";
import { trpc } from "@/lib/trpc";
import { BrandMark } from "@/components/BrandMark";

const STORAGE_KEY = "yijing-poetry-lot-research-v1";

type PoetryGuide = { kind: "guide" | "fallback" | "safety_redirect"; content: string; citations: ResearchCitation[] };

function guideSections(content: string) {
  return content.split(/^## /m).filter(Boolean).map((block) => {
    const [heading, ...body] = block.split("\n");
    return { title: heading.replace(/^\d+\.\s*/, ""), body: body.join("\n").trim() };
  });
}

function localResearchCount() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown[];
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}

function displayLotLabel(lotNumber?: string) {
  const raw = lotNumber?.trim();
  if (!raw) return "詩籤";
  if (/^第\s*.+\s*籤$/.test(raw)) return raw;
  if (/籤$/.test(raw)) return `第 ${raw}`;
  return `第 ${raw} 籤`;
}

export default function PoetryLot() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [lotNumber, setLotNumber] = useState("");
  const [temple, setTemple] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [poemText, setPoemText] = useState("");
  const [question, setQuestion] = useState("");
  const [sourceAcknowledged, setSourceAcknowledged] = useState(false);
  const [guide, setGuide] = useState<PoetryGuide | null>(null);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [share, setShare] = useState<{ id: number; url: string } | null>(null);
  const [savedCount, setSavedCount] = useState(() => typeof window === "undefined" ? 0 : localResearchCount());

  const interpret = trpc.poetryLot.interpret.useMutation({
    onSuccess: (data) => {
      setGuide(data);
      setCreatedAt(Date.now());
      setShare(null);
    },
    onError: () => toast.error("目前無法整理詩籤研究解說，請檢查原文與來源欄位後重試。"),
  });
  const createShare = trpc.share.create.useMutation();
  const revokeShare = trpc.share.revoke.useMutation({ onSuccess: () => { setShare(null); toast.success("已撤銷本次詩籤研究分享連結。 "); } });

  const record = useMemo<ChatRecord | null>(() => {
    if (!guide || !createdAt) return null;
    const sourceLines = [
      `- 籤號：${lotNumber.trim() || "未提供"}`,
      `- 宮廟／系統：${temple.trim() || "未提供"}`,
      `- 來源名稱：${sourceName.trim() || "使用者提供之籤詩原文"}`,
      `- 版本／取得說明：${versionLabel.trim() || "使用者輸入版本；未主張為宮廟或出版單位授權解籤"}`,
      `- 來源網址：${sourceUrl.trim() || "未提供"}`,
    ].join("\n");
    return {
      id: `poetry-lot-${createdAt}`,
      title: `${temple.trim() ? `${temple.trim()}・` : ""}${displayLotLabel(lotNumber)}研究解說`,
      createdAt,
      updatedAt: createdAt,
      starred: false,
      project: "詩籤研究",
      tags: ["詩籤", "文本研究"],
      citations: guide.citations,
      messages: [
        { role: "user", content: `## 籤詩原文\n\n${poemText.trim()}\n\n## 來源與版本\n\n${sourceLines}\n\n## 研究問題\n\n${question.trim() || "未另行指定；請以文本結構與可查證來源為中心閱讀。"}` },
        { role: "assistant", content: guide.content },
      ],
    };
  }, [createdAt, guide, lotNumber, poemText, question, sourceName, sourceUrl, temple, versionLabel]);

  const requestGuide = () => {
    if (!sourceAcknowledged) { toast.error("請先確認您有權輸入、使用及分享此籤詩原文。 "); return; }
    const payload = {
      poemText: poemText.trim(),
      ...(lotNumber.trim() ? { lotNumber: lotNumber.trim() } : {}),
      ...(temple.trim() ? { temple: temple.trim() } : {}),
      ...(sourceName.trim() ? { sourceName: sourceName.trim() } : {}),
      ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
      ...(versionLabel.trim() ? { versionLabel: versionLabel.trim() } : {}),
      ...(question.trim() ? { question: question.trim() } : {}),
    };
    interpret.mutate(payload);
  };

  const saveLocal = () => {
    if (!record) return;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatRecord[];
      const next = [record, ...stored.filter((item) => item.id !== record.id)].slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedCount(next.length);
      toast.success("已存檔於目前瀏覽器；不會自動公開或寫入伺服器。 ");
    } catch {
      toast.error("此瀏覽器目前無法存檔，請改用 Word 或 PDF 匯出。 ");
    }
  };

  const ensureShareLink = async () => {
    if (!record) return null;
    if (!isAuthenticated) { startLogin(); return null; }
    if (share) return share.url;
    try {
      const created = await createShare.mutateAsync({ title: record.title, payload: recordSharePayload(record, false), includesAttachments: false, expiresInDays: 30 });
      const url = `${window.location.origin}/share/${created.token}`;
      setShare({ id: created.id, url });
      return url;
    } catch {
      toast.error("目前無法建立可撤銷分享連結。 ");
      return null;
    }
  };

  const copyResearch = async () => {
    if (!record) return;
    try { await navigator.clipboard.writeText(`${record.messages[0].content}\n\n${record.messages[1].content}`); toast.success("詩籤原文、來源與研究解說已複製。 "); }
    catch { toast.error("瀏覽器未允許複製，請改用 Word 或 PDF。 "); }
  };

  const shareResearch = async () => {
    const url = await ensureShareLink();
    if (!url || !record) return;
    try {
      if (navigator.share) await navigator.share({ title: record.title, text: "含原文來源與版本標示的詩籤研究解說", url });
      else { await navigator.clipboard.writeText(url); toast.success("30 天可撤銷分享連結已複製。 "); }
    } catch { /* User cancelled device sharing; no state change is required. */ }
  };

  const shareToFacebook = async () => {
    const url = await ensureShareLink();
    if (!url) return;
    const popup = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    if (!popup) toast.error("瀏覽器阻擋了 Facebook 分享視窗，請允許彈出視窗後再試。 ");
  };

  const shareToInstagram = async () => {
    const url = await ensureShareLink();
    if (!url || !record) return;
    try {
      if (navigator.share) await navigator.share({ title: record.title, text: "詩籤研究解說（附來源與版本）", url });
      else { await navigator.clipboard.writeText(url); toast.success("已複製連結；請在 Instagram 建立貼文或限時動態時自行貼上。 "); }
    } catch { /* User cancelled device sharing; no state change is required. */ }
  };

  return <main className="min-h-screen bg-[#f8f5ed] px-5 py-24 text-[#1f2b22]">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="max-w-3xl"><BrandMark className="mb-6" /><p className="text-xs font-semibold tracking-[.2em] text-[#9a7131]">詩籤・文本研究工作區</p><h1 className="mt-3 font-serif text-4xl leading-tight">先存原文與來源，
        再讀詩句的意象與轉折</h1><p className="mt-4 text-sm leading-7 text-stone-600">此功能不預載、爬取或宣稱擁有宮廟／現代解籤內容。請輸入您有權使用的籤詩原文與來源資料；AI 僅作可追溯的文化、語義與結構導讀，不提供吉凶、事件或重大決策預測。</p><Link href="/sources" className="mt-4 inline-flex text-sm text-[#835927] underline decoration-[#c9b07e] underline-offset-4">查看文本與版本來源治理</Link></header>

      <section className="rounded-3xl border border-[#d7c9ac] bg-white/70 p-5 sm:p-7"><div className="flex items-start gap-3"><BookMarked className="mt-1 size-5 text-[#9a7131]" /><div><p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">輸入與來源定位</p><h2 className="mt-1 font-serif text-2xl">由你提供可核對的籤詩資料</h2></div></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">籤號（選填）<Input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} maxLength={80} placeholder="例如：第 12 籤" /></label><label className="grid gap-2 text-sm font-medium">宮廟／籤詩系統（選填）<Input value={temple} onChange={(event) => setTemple(event.target.value)} maxLength={160} placeholder="例如：某宮籤詩；不確定可留白" /></label><label className="grid gap-2 text-sm font-medium">來源名稱（選填）<Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} maxLength={240} placeholder="例如：使用者持有籤條、授權刊本、開放資料物件" /></label><label className="grid gap-2 text-sm font-medium">版本／取得說明（選填）<Input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} maxLength={240} placeholder="例如：掃描影像、取得日期、授權版本或異文說明" /></label><label className="md:col-span-2 grid gap-2 text-sm font-medium">來源網址（選填）<Input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></label><label className="md:col-span-2 grid gap-2 text-sm font-medium">籤詩原文<Textarea value={poemText} onChange={(event) => setPoemText(event.target.value)} maxLength={3000} className="min-h-40 leading-7" placeholder="請逐行貼上籤詩原文。不要貼入未取得使用權的現代解籤全文。" /></label><label className="md:col-span-2 grid gap-2 text-sm font-medium">想聚焦的研究問題（選填）<Textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={800} placeholder="例如：請比較詩中的時序、行動詞與轉折意象；不要詢問吉凶或事件結果。" /></label></div><label className="mt-5 flex items-start gap-3 text-sm leading-6 text-stone-700"><input className="mt-1" type="checkbox" checked={sourceAcknowledged} onChange={(event) => setSourceAcknowledged(event.target.checked)} />我確認有權輸入、使用及在我自行選擇分享時分享本次籤詩原文；我了解本功能不會代替宮廟儀式或授權解籤。</label><div className="mt-5 flex flex-wrap gap-3"><Button disabled={!poemText.trim() || !sourceAcknowledged || interpret.isPending} onClick={requestGuide} className="bg-[#1f2b22] text-[#fffaf0] hover:bg-[#33463b]"><Sparkles className="mr-2 size-4" />{interpret.isPending ? "正在整理文本研究…" : "生成詩籤研究解說"}</Button><Button variant="ghost" onClick={() => { setPoemText(""); setQuestion(""); setGuide(null); setCreatedAt(null); setShare(null); }}>清除此頁結果</Button></div>{interpret.error && <p className="mt-3 text-sm text-red-700">目前無法完成解說；請確認原文、網址格式及來源欄位後重試。</p>}</section>

      {guide && record && <section className="space-y-5"><div className="rounded-3xl border border-[#bca46f] bg-[#203126] p-5 text-[#fffaf0] sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#e3c791]">研究解說與限制</p><h2 className="mt-2 font-serif text-2xl">保留歧義，讓原文與來源在場</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#d8ddd4]">{guide.kind === "safety_redirect" ? "此提問已轉為安全的文本研究範圍說明。" : "以下解說僅根據本次輸入的原文與來源欄位；請優先回到原籤、授權版本或可查證資料核對。"}</p><div className="mt-6 grid gap-3 md:grid-cols-2">{guideSections(guide.content).map((section) => <article key={section.title} className="rounded-2xl border border-[#718075] bg-[#f8f5ed] p-4 text-[#1f2b22]"><h3 className="font-serif text-lg text-[#6e522a]">{section.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#334038]">{section.body}</p></article>)}</div></div>
        <section className="rounded-3xl border border-[#d7c9ac] bg-[#fffdf8] p-5 sm:p-7"><p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">原文、來源與版本</p><div className="mt-3 grid gap-3 md:grid-cols-2"><article className="rounded-2xl border border-[#e1d6bc] bg-white p-4"><h3 className="font-serif text-xl">本次原文</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334038]">{poemText}</p></article><article className="rounded-2xl border border-[#e1d6bc] bg-white p-4"><h3 className="font-serif text-xl">可追溯欄位</h3><dl className="mt-3 grid gap-2 text-sm leading-6 text-[#5d665e]"><div><dt className="text-[#9a7131]">籤號／系統</dt><dd>{lotNumber || "未提供"} {temple ? `／${temple}` : ""}</dd></div><div><dt className="text-[#9a7131]">來源</dt><dd>{guide.citations[0]?.sourceLabel}</dd></div><div><dt className="text-[#9a7131]">版本</dt><dd>{guide.citations[0]?.versionLabel}</dd></div><div><dt className="text-[#9a7131]">網址</dt><dd className="break-all">{guide.citations[0]?.sourceUrl}</dd></div></dl></article></div></section>
        <section className="rounded-3xl border border-[#d7c9ac] bg-white/70 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">研究交付</p><h2 className="mt-2 font-serif text-2xl">可帶走，也可撤銷分享</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Word／PDF 會納入原文、來源、版本與研究解說。本機存檔僅留在此瀏覽器；公開分享須登入，連結效期為 30 天且可在本頁撤銷。</p></div><p className="rounded-full bg-[#f4ead7] px-3 py-1 text-xs text-[#805d2b]">本機存檔 {savedCount} 筆</p></div><div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><Button size="sm" variant="outline" onClick={saveLocal}><Save className="mr-1 size-3.5" />存檔</Button><Button size="sm" variant="outline" onClick={copyResearch}><ClipboardCopy className="mr-1 size-3.5" />複製</Button><Button size="sm" variant="outline" onClick={() => downloadRecordWord(record)}><FileText className="mr-1 size-3.5" />Word</Button><Button size="sm" variant="outline" onClick={() => { if (!openRecordPrintView(record)) toast.error("瀏覽器阻擋了列印視窗，請允許彈出視窗後再試。 "); }}><FileDown className="mr-1 size-3.5" />PDF</Button><Button size="sm" variant="outline" disabled={createShare.isPending} onClick={shareResearch}><Share2 className="mr-1 size-3.5" />分享</Button><Button size="sm" variant="outline" disabled={createShare.isPending} onClick={shareToFacebook}><Facebook className="mr-1 size-3.5" />Facebook</Button><Button size="sm" variant="outline" disabled={createShare.isPending} onClick={shareToInstagram}><Instagram className="mr-1 size-3.5" />IG</Button></div>{share && <div className="mt-5 rounded-2xl border border-[#d7c9ac] bg-[#f9f4e8] p-4"><p className="text-sm leading-6 text-[#5d5b4e]"><Link2 className="mr-1 inline size-4 text-[#9a7131]" />已建立 30 天可撤銷分享連結；內容包含本次原文與來源欄位，請自行確認是否適合公開。</p><p className="mt-2 break-all text-xs text-[#6d776e]">{share.url}</p><Button size="sm" variant="ghost" className="mt-2 text-[#8e3e31]" disabled={revokeShare.isPending} onClick={() => revokeShare.mutate({ id: share.id })}><Undo2 className="mr-1 size-3.5" />撤銷此連結</Button></div>}{!isAuthenticated && <p className="mt-4 flex items-center gap-2 text-sm text-[#6d776e]"><LockKeyhole className="size-4" />分享連結需要登入後才建立；<button className="underline underline-offset-4" onClick={() => startLogin()}>登入</button>即可使用。</p>}</section>
      </section>}
      <footer className="border-t border-[#d7c9ac] pt-5 text-xs leading-6 text-[#707971]">本工作區僅供詩籤文本、語詞、典故與文化脈絡研究；不構成宗教儀式替代、吉凶預測、醫療、法律、投資或其他重大決策意見。<button className="ml-2 text-[#835927] underline underline-offset-4" onClick={() => setLocation("/")}>回到觀易首頁</button></footer>
    </div>
  </main>;
}
