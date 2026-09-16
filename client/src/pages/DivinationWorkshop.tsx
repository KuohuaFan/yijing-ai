import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Check, CircleHelp, Coins, RotateCcw, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { HexagramDiagram } from "@/components/HexagramDiagram";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { lineMeta, lineValueLabel, type Citation } from "@/lib/yijing";
import { appendDivinationHistory } from "@/lib/chatHistory";

const riskPattern = /(診斷|治療|病情|癌|手術|藥物|懷孕|投資|買股|股票|交易|基金|虛擬貨幣|訴訟|判決|法律意見|契約|賭博|自殺|自傷)/i;

function valueFromCoins() { return Array.from({ length: 3 }, () => Math.random() > 0.5 ? 3 : 2).reduce((sum, value) => sum + value, 0); }

export default function DivinationWorkshop() {
  const { isAuthenticated } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [question, setQuestion] = useState("");
  const [lineValues, setLineValues] = useState<number[]>([]);
  const [lastCoins, setLastCoins] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [guide, setGuide] = useState<{ content: string; citations: Citation[] } | null>(null);
  const calculate = trpc.divination.calculate.useMutation();
  const save = trpc.divination.save.useMutation();
  const askGuide = trpc.guide.create.useMutation({ onSuccess: (data) => setGuide(data) });
  const riskDetected = useMemo(() => riskPattern.test(question), [question]);

  useEffect(() => {
    const accepted = window.localStorage.getItem("yijing-divination-disclosure") === "accepted";
    setAcknowledged(accepted);
    setShowDisclosure(!accepted);
  }, []);

  const acceptDisclosure = () => { window.localStorage.setItem("yijing-divination-disclosure", "accepted"); setAcknowledged(true); setShowDisclosure(false); };
  const reset = () => { setLineValues([]); setLastCoins([]); setResult(null); setGuide(null); };
  const toss = () => {
    if (!acknowledged || lineValues.length >= 6) return;
    const coins = Array.from({ length: 3 }, () => Math.random() > 0.5 ? 3 : 2);
    const value = coins.reduce((sum, item) => sum + item, 0);
    const next = [...lineValues, value];
    setLastCoins(coins);
    setLineValues(next);
    if (next.length === 6) {
      calculate.mutate({ lineValues: next as [6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9] }, { onSuccess: (data) => {
        setResult(data);
        appendDivinationHistory({ question, lineValues: next, originalId: data.original.id, originalName: data.original.name, transformedId: data.transformed.id, transformedName: data.transformed.name, movingLines: data.movingLines });
        if (isAuthenticated) save.mutate({ question: question || undefined, method: "three_coins", lineValues: next as any });
      }});
    }
  };

  return <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]"><SiteHeader /><main className="container py-10 lg:py-14"><div className="mx-auto max-w-6xl"><div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">卜卦工坊</p><h1 className="mt-2 font-serif text-4xl font-semibold">起一卦，觀一變</h1><p className="mt-3 max-w-xl text-sm leading-7 text-[#626c63]">三錢法由下爻至上爻進行六次。完成後，系統將以本卦、變爻與之卦開啟原典導讀。</p></div><Button variant="outline" onClick={() => setShowDisclosure(true)} className="border-[#b99a70] bg-transparent text-[#674821]"><CircleHelp className="mr-2 size-4" />閱讀使用說明</Button></div>
    <div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-[#ccb98f]/65 bg-[#fffdf8] p-6 shadow-[0_16px_45px_rgba(52,49,36,.07)]"><div className="flex items-center justify-between border-b border-[#e2d9c7] pb-5"><div><p className="text-xs font-semibold tracking-[0.14em] text-[#a06b2d]">第一步・定其所問</p><h2 className="mt-1 font-serif text-2xl">把情境化為可觀察的問題</h2></div><span className="grid size-10 place-items-center rounded-full bg-[#eef0e8] text-[#4f6156]"><Coins className="size-5" /></span></div><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：我正面臨兩種做法，應先釐清哪些條件？" className="mt-5 min-h-28 border-[#d8cdb9] bg-[#fbf9f3] text-sm leading-6 focus-visible:ring-[#ad6f28]" />{riskDetected && <div className="mt-4 flex gap-3 rounded-lg border border-[#c98665]/40 bg-[#fff4ea] p-3 text-sm leading-6 text-[#7f4027]"><AlertTriangle className="mt-1 size-4 shrink-0" /><span>此問題涉及重大醫療、法律、投資或安全決策。你仍可閱讀文本，但系統不會提供依卦作出的預測或具體行動指令。</span></div>}
      <div className="mt-7 border-t border-[#e2d9c7] pt-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-[#a06b2d]">第二步・三錢起卦</p><p className="mt-1 text-xs text-[#737b73]">第 {Math.min(lineValues.length + 1, 6)} 爻・由下而上</p></div><span className="text-xs text-[#8b7658]">6＝老陰　7＝少陽　8＝少陰　9＝老陽</span></div><div className="mt-5 flex items-center gap-4"><Button size="lg" disabled={!acknowledged || lineValues.length >= 6 || calculate.isPending} onClick={toss} className="bg-[#1f2a25] px-6 text-[#fffaf0] hover:bg-[#33463b]"><Coins className="mr-2 size-4" />投擲三錢</Button><Button variant="ghost" onClick={reset} className="text-[#697269]"><RotateCcw className="mr-2 size-4" />重新起卦</Button></div>{lastCoins.length > 0 && <p className="mt-4 text-xs text-[#857963]">剛才的三枚錢值：{lastCoins.join("＋")}＝{lastCoins.reduce((sum, value) => sum + value, 0)}</p>}</div>
      <div className="mt-7 rounded-xl bg-[#eef0e8] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold tracking-[0.12em] text-[#52665a]">六爻紀錄・下至上</p><span className="text-xs text-[#697269]">{lineValues.length}/6</span></div><div className="mt-4 grid grid-cols-6 gap-2">{Array.from({ length: 6 }, (_, index) => { const value = lineValues[index]; const meta = value ? lineMeta(value) : null; return <div key={index} className="min-h-20 rounded-lg border border-[#cad2c8] bg-[#f9faf7] p-2 text-center"><p className="text-[10px] text-[#778077]">{["初", "二", "三", "四", "五", "上"][index]}爻</p>{value ? <><strong className="mt-2 block font-serif text-xl text-[#203028]">{value}</strong><span className={`mt-1 block text-[9px] ${meta?.moving ? "text-[#ad6f28]" : "text-[#6e776e]"}`}>{meta?.label}{meta?.moving ? "・變" : ""}</span></> : <span className="mt-5 block text-lg text-[#b4bbb2]">—</span>}</div>})}</div></div></section>
      <section className="min-h-[560px] rounded-2xl border border-[#24342c]/10 bg-[#1f2a25] p-6 text-[#f9f5ea] shadow-[0_16px_45px_rgba(31,42,37,.12)]">{!result ? <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center"><div className="grid size-20 place-items-center rounded-full border border-[#d9bf8f]/35 text-[#e3c791]"><span className="text-4xl">☯</span></div><h2 className="mt-7 font-serif text-3xl">卦象尚待生成</h2><p className="mt-3 max-w-sm text-sm leading-7 text-[#cbd4cb]">完成六次投擲後，這裡將同時呈現本卦、變爻與之卦，並開啟可追溯的原典導讀。</p></div> : <div><div className="flex items-center justify-between border-b border-white/15 pb-4"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#d5b680]">解圖・本卦 → 之卦</p><h2 className="mt-1 font-serif text-2xl">卦象的變化</h2></div>{isAuthenticated ? <span className="rounded-full bg-[#d1b17d]/15 px-3 py-1 text-[10px] text-[#e6cb99]">已自動保存至書架</span> : <span className="text-[10px] text-[#d7ddd5]">登入後自動保存</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-8"><HexagramDiagram pattern={result.original.lines} movingLines={result.movingLines} name={result.original.name} number={result.original.id} className="text-[#f8f2e5]" /><ArrowRight className="size-5 text-[#d7bb84]" /><HexagramDiagram pattern={result.transformed.lines} name={result.transformed.name} number={result.transformed.id} /></div><div className="grid grid-cols-2 gap-3 border-y border-white/15 py-4 text-xs"><div><p className="text-[#b9c5bb]">下卦</p><p className="mt-1 font-serif text-lg">{result.lowerTrigram}</p></div><div><p className="text-[#b9c5bb]">上卦</p><p className="mt-1 font-serif text-lg">{result.upperTrigram}</p></div><div><p className="text-[#b9c5bb]">變爻</p><p className="mt-1 font-serif text-lg">{result.movingLines.length ? result.movingLines.join("、") : "無"}</p></div><div><p className="text-[#b9c5bb]">本卦序</p><p className="mt-1 font-serif text-lg">第 {result.original.id} 卦</p></div></div><div className="mt-6"><p className="text-[10px] font-semibold tracking-[0.15em] text-[#d5b680]">以古書與 AI 並行閱讀</p><p className="mt-2 text-sm leading-6 text-[#d7ded7]">先讀卦辭與動爻，再比較彖象與之卦。AI 只會依據頁面中的可引文本提供六段導讀。</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => askGuide.mutate({ question: question || `請導讀${result.original.name}卦的文本結構`, lineValues: lineValues as [6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9] })} disabled={askGuide.isPending || riskDetected} className="bg-[#d4b477] text-[#2a3029] hover:bg-[#e0c58f]"><Sparkles className="mr-2 size-4" />{askGuide.isPending ? "整理原文中…" : "開啟 AI 導讀"}</Button><Link href={`/reader/${result.original.id}`}><Button variant="outline" className="border-white/25 bg-transparent text-[#f9f5ea] hover:bg-white/10">閱讀本卦原文</Button></Link></div>{riskDetected && <p className="mt-3 text-xs leading-5 text-[#efc2aa]">高風險問題已啟用保護：請改以讀本查閱文字脈絡，或諮詢相關合格專業人士。</p>}</div>{guide && <div className="mt-6 rounded-xl bg-[#f8f5ee] p-5 text-[#25352c]"><div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[#1f2a25] prose-p:leading-7"><pre className="whitespace-pre-wrap font-sans text-sm leading-7">{guide.content}</pre></div></div>}</div>}</section></div></div></main>
    <Dialog open={showDisclosure} onOpenChange={setShowDisclosure}><DialogContent className="max-w-lg border-[#c9b07e] bg-[#fffdf8]"><DialogHeader><DialogTitle className="font-serif text-2xl text-[#1f2a25]">開始前，請先理解這項工具</DialogTitle><DialogDescription className="pt-3 text-sm leading-7 text-[#59645b]">數位起卦為閱讀與反思工具，不保證預測，也不取代醫療、法律、投資或其他專業意見。系統會保存起卦的結構資料與你選擇留下的筆記，讓你回看自己的閱讀歷程。</DialogDescription></DialogHeader><div className="rounded-lg bg-[#f1ede2] p-4 text-sm leading-6 text-[#616a61]">你可以隨時從卦辭、動爻、彖象與不同脈絡出發，形成自己的理解；AI 導讀將標示限制，並不會把文本轉化為行動命令。</div><DialogFooter><Button variant="outline" onClick={() => setShowDisclosure(false)}>暫不開始</Button><Button className="bg-[#1f2a25]" onClick={acceptDisclosure}><Check className="mr-2 size-4" />我已理解並繼續</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
