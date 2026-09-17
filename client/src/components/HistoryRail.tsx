import { useMemo, useState } from "react";
import { Archive, Bookmark, Download, FileDown, FolderKanban, Home, Menu, Plus, Save, Search, Share2, Star, Tag, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatRecord } from "@/lib/chatHistory";
import { buildHistoryGroups } from "@/lib/historyFilter";
import { BrandIcon } from "@/components/BrandMark";

type HistoryRailProps = {
  records: ChatRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: () => void;
  onStar: () => void;
  onProject: (project: string) => void;
  onTag: (tag: string) => void;
  onSave: () => void;
  onShare: () => void;
  onRevokeShare: () => void;
  onDownloadMarkdown: () => void;
  onDownloadJson: () => void;
  onPrint: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
};

export function HistoryRail({ records, activeId, onSelect, onNew, onDelete, onStar, onProject, onTag, onSave, onShare, onRevokeShare, onDownloadMarkdown, onDownloadJson, onPrint, isAuthenticated, onLogin }: HistoryRailProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tagName, setTagName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [artifactOpen, setArtifactOpen] = useState(false);
  const { active, starred, allChats, projects } = useMemo(() => buildHistoryGroups(records, activeId, query), [activeId, query, records]);

  const select = (id: string) => { onSelect(id); setOpen(false); };
  const row = (record: ChatRecord, tone: "plain" | "starred" = "plain") => <button key={record.id} onClick={() => select(record.id)} className={cn("w-full px-1 py-2 text-left text-[15px] leading-6 transition-colors", record.id === activeId ? "font-semibold text-[#21332a]" : "text-[#303a34] hover:text-[#926a32]", tone === "starred" && "flex items-start gap-2")}>
    {tone === "starred" && <Bookmark className="mt-1 size-3.5 shrink-0 text-[#b78950]" />}
    <span className="line-clamp-2">{record.title}</span>
  </button>;

  return <>
    <Button aria-label="開啟研讀歷程" size="icon" variant="ghost" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-[80] rounded-full bg-[#fffdf8]/90 text-[#1f2a25] shadow-[0_8px_28px_rgba(31,42,37,.12)] backdrop-blur hover:bg-[#fffdf8]"><Menu className="size-5" /></Button>
    <aside className={cn("pointer-events-auto fixed inset-y-0 left-0 z-[90] flex w-[min(24rem,92vw)] flex-col bg-[#fbfaf7] shadow-[22px_0_55px_rgba(31,42,37,.16)] transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
      <header className="flex shrink-0 items-center gap-3 border-b border-[#e5e2da] px-5 py-5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandIcon className="size-10" />
          <div className="min-w-0">
            <p className="whitespace-nowrap font-serif text-xl font-semibold tracking-[.12em] text-[#26332c]">觀易</p>
            <p className="whitespace-nowrap text-[11px] text-[#8c775b]">你的研讀歷程</p>
          </div>
        </div>
        <Button aria-label="收起歷程" size="icon" variant="ghost" onClick={() => setOpen(false)} className="shrink-0"><X className="size-5" /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-1 border-b border-[#e5e2da] py-4">
          <button onClick={isAuthenticated ? undefined : onLogin} className="flex w-full items-center gap-3 rounded-xl bg-[#f1efff] px-3 py-3 text-left"><UserRound className="size-5 text-[#7867cd]" /><span><b className="block text-sm text-[#31313c]">帳號與保存</b><small className="text-xs text-[#6a6a75]">{isAuthenticated ? "附件、專案與成果已同步" : "完成設定後可保存對話、專案與成果"}</small></span></button>
          <button onClick={() => window.location.assign("/")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f2f0eb]"><Home className="size-5 text-[#a27843]" /><b className="text-lg text-[#27332c]">觀易首頁</b></button>
          <div className="rounded-xl px-3 py-3"><div className="flex items-center gap-3"><FolderKanban className="size-5" /><span>Projects</span></div>{projects.length ? <div className="mt-2 flex flex-wrap gap-2">{projects.map((project) => <button key={project} onClick={() => onProject(project)} className="rounded-full bg-[#f0ede6] px-3 py-1.5 text-xs text-[#604d34]">{project}</button>)}</div> : <button onClick={() => active && onProject(projectName || "研讀專案")} className="mt-2 text-xs text-[#8c775b] underline">建立第一個研讀專案</button>}</div>
          <button aria-expanded={artifactOpen} aria-controls="history-artifacts" onClick={() => setArtifactOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f2f0eb]"><Archive className="size-5" /><span>Artifacts</span></button>
          {artifactOpen && <div id="history-artifacts" className="ml-8 grid gap-1 border-l border-[#ded7c8] pl-3"><button onClick={onSave} className="flex items-center gap-2 py-2 text-sm"><Save className="size-3.5" />儲存目前紀錄</button><button disabled={!active} onClick={onShare} className="flex items-center gap-2 py-2 text-sm disabled:opacity-40"><Share2 className="size-3.5" />建立分享連結</button><button disabled={!active} onClick={onPrint} className="flex items-center gap-2 py-2 text-sm disabled:opacity-40"><FileDown className="size-3.5" />匯出 PDF</button></div>}
        </div>

        <div className="pt-5"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-[#8c8a83]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && query.trim().length >= 2) window.location.assign(`/search?q=${encodeURIComponent(query.trim())}`); }} placeholder="搜尋對話與原典（按 Enter）…" className="h-10 border-0 bg-[#f3f2f0] pl-9 shadow-none" /></div><p className="mt-2 text-[10px] leading-5 text-[#8a867e]">按 Enter 以搜尋原典、十翼與本人可見研讀資料。</p></div>
        <section className="pt-6"><h2 className="text-xs font-semibold tracking-[.16em] text-[#99968f]">STARRED</h2><div className="mt-2">{starred.length ? starred.map((record) => row(record, "starred")) : <p className="py-1 text-xs text-[#a09b92]">尚無已收藏的研讀。</p>}</div></section>
        {active && <section className="pt-6"><h2 className="text-xs font-semibold tracking-[.16em] text-[#99968f]">CURRENT</h2><div className="mt-2">{row(active)}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onStar}><Star className={cn("mr-1 size-3.5", active.starred && "fill-[#b77a2c]")} />收藏</Button><Button size="sm" variant="outline" onClick={onDelete}><Trash2 className="mr-1 size-3.5" />刪除</Button><Button size="sm" variant="outline" onClick={onDownloadMarkdown}><Download className="mr-1 size-3.5" />MD</Button><Button size="sm" variant="outline" onClick={onDownloadJson}>JSON</Button></div><div className="mt-2 flex gap-2"><Input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="加標籤" className="h-8 text-xs" /><Button size="sm" disabled={!tagName.trim()} onClick={() => { onTag(tagName.trim()); setTagName(""); }}><Tag className="size-3.5" /></Button></div>{active.share && <button onClick={onRevokeShare} className="mt-2 text-xs text-[#9a5a37] underline">撤銷目前分享連結</button>}</section>}
        <section className="pt-6"><div className="flex items-center justify-between"><h2 className="text-xs font-semibold tracking-[.16em] text-[#99968f]">ALL CHATS</h2><Button size="sm" variant="ghost" onClick={onNew} className="h-7 px-2 text-xs"><Plus className="mr-1 size-3" />新增</Button></div><div className="mt-2">{allChats.length ? allChats.map((record) => row(record)) : <p className="py-6 text-sm text-[#8c8a83]">尚無其他研讀紀錄。</p>}</div></section>
      </div>
      <footer className="border-t border-[#e5e2da] px-6 py-4 text-[10px] leading-5 text-[#8a867e]">{isAuthenticated ? "已登入：附件與受控分享會保存到個人帳號。" : "未登入時，歷程僅保留於目前瀏覽器。"}</footer>
    </aside>
    {open && <button aria-label="關閉歷程側欄" onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-[#1f2a25]/35 backdrop-blur-[1px]" />}
  </>;
}
