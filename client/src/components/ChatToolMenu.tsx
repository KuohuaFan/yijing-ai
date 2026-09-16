import { Link } from "wouter";
import { useState } from "react";
import { BookOpen, CalendarDays, Compass, FileText, Menu, PanelsTopLeft, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandMark";

export function ChatToolMenu({ onDivine }: { onDivine: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <div className="fixed right-4 top-4 z-40"><Button aria-label="開啟功能選單" size="icon" variant="ghost" onClick={() => setOpen((current) => !current)} className="rounded-full bg-[#fffdf8]/90 text-[#1f2a25] shadow-[0_8px_28px_rgba(31,42,37,.12)] backdrop-blur hover:bg-[#fffdf8]">{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>{open && <div className="absolute right-0 top-12 w-64 rounded-2xl border border-[#c9b07e]/70 bg-[#fffdf8]/98 p-3 shadow-[0_18px_48px_rgba(31,42,37,.16)] backdrop-blur-xl"><div className="flex items-center gap-2 px-3 pb-3 pt-1"><BrandIcon className="size-7" /><p className="text-[10px] font-semibold tracking-[0.16em] text-[#9a7442]">易經 AI・功能選單</p></div><button onClick={() => { onDivine(); close(); }} className="flex w-full items-center gap-3 rounded-xl bg-[#1f2a25] px-3 py-3 text-left text-sm font-medium text-[#fffaf0]"><Compass className="size-4 text-[#e3c791]" />起一卦</button><div className="mt-2 grid gap-1">{[
	    ["/bazi", "排八字・流年", CalendarDays], ["/poetry-lot", "解詩籤", FileText], ["/library", "讀原文", BookOpen], ["/library?tab=hexagrams", "查卦・六十四卦", Search], ["/library?tab=wings", "學八卦・十翼", Sparkles], ["/shelf", "個人書架", PanelsTopLeft], ["/sources", "版本與來源", FileText],
  ].map(([href, label, Icon]) => <Link key={href as string} href={href as string} onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#48554b] hover:bg-[#efe8da]"><Icon className="size-4 text-[#9b6c32]" />{label as string}</Link>)}</div></div>}</div>;
}
