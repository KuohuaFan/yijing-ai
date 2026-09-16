import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, FileSearch, LockKeyhole, Search as SearchIcon, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type ResultLink = { title: string; excerpt: string; href: string; anchor?: string; sourceLabel?: string; sourceUrl?: string; versionLabel?: string; visibility: "public" | "private" | "shared"; kind: string };

function ResultCard({ result }: { result: ResultLink }) {
  const privateResult = result.visibility !== "public";
  return <Link href={result.href} className="block rounded-2xl border border-[#24342c]/10 bg-[#fffdf8] p-5 transition-all hover:-translate-y-0.5 hover:border-[#b78a4d] hover:shadow-[0_10px_24px_rgba(48,47,37,.08)]">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-lg font-semibold text-[#243129]">{result.title}</h3><span className="inline-flex items-center gap-1 rounded-full bg-[#f3eee2] px-2.5 py-1 text-[10px] font-semibold text-[#775a31]">{privateResult ? <LockKeyhole className="size-3" /> : <BookOpen className="size-3" />}{privateResult ? (result.visibility === "shared" ? "共享研讀" : "私人研讀") : "公開原典"}</span></div>
    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#566057]">{result.excerpt}</p>
    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8a806f]">{result.anchor && <span>錨點：#{result.anchor}</span>}{result.versionLabel && <span>版本：{result.versionLabel}</span>}{result.sourceLabel && <span>來源：{result.sourceLabel}</span>}</div>
  </Link>;
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const initial = useMemo(() => new URLSearchParams(window.location.search).get("q") ?? "", []);
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const enabled = submitted.trim().length >= 2;
  const search = trpc.search.unified.useQuery({ query: submitted.trim() || "__" }, { enabled });
  const submit = () => {
    const next = query.trim();
    if (next.length < 2) return;
    setSubmitted(next);
    setLocation(`/search?q=${encodeURIComponent(next)}`);
  };
  const canonical = search.data?.canonical ?? [];
  const personal = search.data?.personal ?? [];

  return <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]"><SiteHeader /><main className="container pb-[calc(5rem+env(safe-area-inset-bottom))] pt-12"><header className="max-w-3xl"><p className="eyebrow">統一搜尋</p><h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">從原典到自己的研讀紀錄</h1><p className="mt-4 text-sm leading-7 text-[#626c63]">公開原典結果保留來源、版本與段落錨點；登入後，系統才會在同一頁列出您本人可見的起卦、反思與註解。</p></header>
    <div className="mt-8 flex gap-2 rounded-2xl border border-[#d8cdb9] bg-[#fffdf8] p-2"><div className="relative min-w-0 flex-1"><SearchIcon className="absolute left-3 top-3 size-4 text-[#8c8a83]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="輸入至少兩字，例如：潛龍、厚德、蒙以養正" className="border-0 bg-transparent pl-9 shadow-none" /></div><Button onClick={submit} disabled={query.trim().length < 2} className="bg-[#1f2a25] text-[#fffaf0]"><SearchIcon className="mr-1.5 size-4" />搜尋</Button></div>
    {search.isFetching && <p className="mt-8 text-sm text-[#697269]">正在整理原典與可見研讀資料…</p>}
    {enabled && !search.isFetching && <div className="mt-9 grid gap-10"><section><div className="flex items-center gap-2"><BookOpen className="size-5 text-[#a66b28]" /><h2 className="font-serif text-2xl font-semibold">公開原典與十翼</h2><span className="text-xs text-[#8a806f]">{canonical.length} 筆</span></div><div className="mt-4 grid gap-3">{canonical.length ? canonical.map((result) => <ResultCard key={`${result.kind}-${result.anchor}`} result={result} />) : <p className="rounded-xl border border-dashed border-[#d8cdb9] p-5 text-sm text-[#7c847b]">找不到相符的公開原典段落。可改用不同字詞或較短的關鍵詞。</p>}</div></section>
      <section><div className="flex items-center gap-2"><Sparkles className="size-5 text-[#a66b28]" /><h2 className="font-serif text-2xl font-semibold">我的研讀</h2><span className="text-xs text-[#8a806f]">{personal.length} 筆</span></div><p className="mt-2 text-xs leading-6 text-[#7c847b]">此區僅回傳登入帳號本人可見的起卦、反思與註解；共享註解會清楚標示為共享。</p><div className="mt-4 grid gap-3">{personal.length ? personal.map((result) => <ResultCard key={`${result.kind}-${result.title}-${result.href}`} result={result} />) : <p className="rounded-xl border border-dashed border-[#d8cdb9] p-5 text-sm text-[#7c847b]">目前沒有符合的私人研讀資料；未登入時，私人內容不會被搜尋或顯示。</p>}</div></section></div>}
    {!enabled && <div className="mt-10 rounded-2xl border border-[#d8cdb9] bg-[#fffdf8] p-6 text-sm leading-7 text-[#657066]"><FileSearch className="mb-3 size-6 text-[#a66b28]" />請輸入至少兩個字開始搜尋。每筆公開結果均附來源、版本與錨點；點選後會前往對應讀本段落。</div>}
  </main></div>;
}
