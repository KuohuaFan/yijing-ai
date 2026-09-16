import { useState } from "react";
import { Link } from "wouter";
import { BookHeart, CalendarDays, FilePenLine, LogIn, NotebookPen, Plus } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export default function Shelf() {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const divinations = trpc.divination.mine.useQuery(undefined, { enabled: isAuthenticated });
  const notes = trpc.reflection.mine.useQuery(undefined, { enabled: isAuthenticated });
  const create = trpc.reflection.create.useMutation({ onSuccess: () => { setTitle(""); setBody(""); notes.refetch(); } });

  if (!isAuthenticated) return <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]"><SiteHeader /><main className="container flex min-h-[70vh] items-center justify-center"><div className="max-w-md rounded-2xl border border-[#ccb98f]/60 bg-[#fffdf8] p-8 text-center shadow-[0_16px_45px_rgba(52,49,36,.08)]"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eaf0e8] text-[#476050]"><BookHeart className="size-7" /></span><h1 className="mt-5 font-serif text-3xl font-semibold">把理解留在自己的書架</h1><p className="mt-3 text-sm leading-7 text-[#657066]">登入後，系統會自動保存你的起卦紀錄、引文與反思筆記，並依時間排列回顧路徑。</p><Button className="mt-6 bg-[#1f2a25]" onClick={startLogin}><LogIn className="mr-2 size-4" />登入並開啟書架</Button></div></main></div>;

  return <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]"><SiteHeader /><main className="container pb-[calc(4rem+env(safe-area-inset-bottom))] pt-10"><header><p className="eyebrow">個人書架</p><h1 className="mt-2 font-serif text-4xl font-semibold">讓一次閱讀成為可回看的路徑</h1><p className="mt-4 text-sm leading-7 text-[#677167]">起卦、引文與你留下的觀察會以時間線保存。這不是預測紀錄，而是你的閱讀與反思檔案。</p></header>
    <div className="mt-8 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-2xl border border-[#24342c]/10 bg-[#fffdf8] p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#e9f0e9] text-[#476050]"><CalendarDays className="size-4" /></span><div><p className="text-xs font-semibold tracking-[0.13em] text-[#9a6b30]">起卦時間軸</p><h2 className="font-serif text-2xl">最近的卦象紀錄</h2></div></div><div className="mt-6 grid gap-3">{divinations.isLoading ? <p className="text-sm text-[#697269]">載入紀錄中…</p> : divinations.data?.length ? divinations.data.map((record) => <article key={record.id} id={`divination-${record.id}`} className="scroll-mt-28"><Link href={`/reader/${record.originalHexagramId}`} className="flex items-center justify-between rounded-xl border border-[#e1d6c2] bg-[#fcfaf5] p-4 transition-colors hover:bg-[#f4efdf]"><div><p className="text-xs font-semibold text-[#9b6c32]">本卦 第 {record.originalHexagramId} 卦 → 之卦 第 {record.transformedHexagramId} 卦</p><p className="mt-1 max-w-sm truncate text-sm text-[#4f5b51]">{record.question || "未記錄問題"}</p><p className="mt-2 text-[10px] text-[#8a806f]">{new Date(record.createdAt).toLocaleString()}</p></div><span className="text-xs text-[#788178]">查看原文</span></Link></article>) : <div className="rounded-xl bg-[#f2eee5] p-5 text-sm leading-6 text-[#6d756d]">尚未保存起卦紀錄。完成一次三錢起卦後，會自動顯示於此。<Link href="/divine" className="ml-2 font-semibold text-[#8d5d24]">現在起卦</Link></div>}</div></section>
      <section className="rounded-2xl bg-[#1f2a25] p-6 text-[#f9f5ea]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-white/10 text-[#e5c895]"><NotebookPen className="size-4" /></span><div><p className="text-xs font-semibold tracking-[0.13em] text-[#d5b680]">反思畫布</p><h2 className="font-serif text-2xl">留下一則當下觀察</h2></div></div><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="這則筆記的標題" className="mt-6 border-white/15 bg-white/10 text-white placeholder:text-[#cbd3ca]" /><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="記下你從原文、卦象或導讀中看到的條件與問題…" className="mt-3 min-h-36 border-white/15 bg-white/10 text-sm leading-6 text-white placeholder:text-[#cbd3ca]" /><Button disabled={!title.trim() || !body.trim() || create.isPending} onClick={() => create.mutate({ title, body })} className="mt-3 bg-[#d5b680] text-[#273129] hover:bg-[#e2c995]"><Plus className="mr-2 size-4" />保存到書架</Button></section>
    </div>
    <section className="mt-7 rounded-2xl border border-[#24342c]/10 bg-[#fffdf8] p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f4ead7] text-[#9b6c32]"><FilePenLine className="size-4" /></span><div><p className="text-xs font-semibold tracking-[0.13em] text-[#9a6b30]">個人筆記</p><h2 className="font-serif text-2xl">反思與引文</h2></div></div><div className="mt-6 grid gap-3 md:grid-cols-2">{notes.data?.length ? notes.data.map((note) => <article key={note.id} id={`reflection-${note.id}`} className="scroll-mt-28 rounded-xl border border-[#e1d6c2] bg-[#fcfaf5] p-4"><h3 className="font-serif text-lg font-semibold">{note.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5d675e]">{note.body}</p><p className="mt-3 text-[10px] text-[#8a806f]">{new Date(note.updatedAt).toLocaleString()}</p></article>) : <p className="text-sm text-[#697269]">尚未建立筆記。</p>}</div></section>
  </main></div>;
}
