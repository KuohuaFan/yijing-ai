import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Check, Coins, RotateCcw, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { lineMeta, lineValueLabel } from "@/lib/yijing";
import type { DivinationSnapshot } from "@/lib/chatHistory";

const riskPattern = /(診斷|治療|病情|癌|手術|藥物|懷孕|投資|買股|股票|交易|基金|虛擬貨幣|訴訟|判決|法律意見|契約|賭博|自殺|自傷)/i;
type SixLines = [6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9];

export function DivinationInChat({ open, onOpenChange, onComplete, onAiGuide, onOpenOriginal }: { open: boolean; onOpenChange: (open: boolean) => void; onComplete: (snapshot: DivinationSnapshot, message: string) => void; onAiGuide: (snapshot: DivinationSnapshot) => void; onOpenOriginal: (hexagramId: number) => void }) {
  const { isAuthenticated } = useAuth();
  const [question, setQuestion] = useState("");
  const [lineValues, setLineValues] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const calculate = trpc.divination.calculate.useMutation();
  const save = trpc.divination.save.useMutation();
  const riskDetected = useMemo(() => riskPattern.test(question), [question]);
  const reset = () => { setQuestion(""); setLineValues([]); setResult(null); };
  const toss = () => {
    if (lineValues.length >= 6) return;
    const value = Array.from({ length: 3 }, () => Math.random() > 0.5 ? 3 : 2).reduce((sum, item) => sum + item, 0);
    const next = [...lineValues, value];
    setLineValues(next);
    if (next.length === 6) calculate.mutate({ lineValues: next as SixLines }, { onSuccess: (data) => {
      setResult(data);
      const snapshot: DivinationSnapshot = { question, lineValues: next, originalId: data.original.id, originalName: data.original.name, transformedId: data.transformed.id, transformedName: data.transformed.name, movingLines: data.movingLines };
      const message = `## 起卦紀錄\n\n**所問**：${question || "未填寫問題"}\n\n本卦為 **${data.original.name}（第 ${data.original.id} 卦）**；${data.movingLines.length ? `第 ${data.movingLines.join("、")} 爻為變爻，之卦為 **${data.transformed.name}（第 ${data.transformed.id} 卦）**。` : "本次未見變爻。"}\n\n六爻（下至上）：${next.join("、")}。\n\n> 這筆結果已自動加入左側歷程，供回看原文與反思。`;
      onComplete(snapshot, message);
      if (isAuthenticated) save.mutate({ question: question || undefined, method: "three_coins", lineValues: next as SixLines });
    }});
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl border-[#c9b07e] bg-[#f8f5ee] p-0"><DialogHeader className="border-b border-[#d9cfbd] px-6 py-5"><DialogTitle className="font-serif text-3xl text-[#1f2a25]">起一卦，觀一變</DialogTitle><DialogDescription className="pt-2 text-sm leading-6 text-[#687168]">以三錢法由下而上起六爻。完成的卦象會自動留在此對話與左側紀錄。</DialogDescription></DialogHeader><div className="max-h-[65vh] overflow-y-auto px-6 py-5"><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="可以先寫下想要觀察的情境或文本問題…" className="min-h-24 rounded-none border-0 bg-transparent px-0 leading-6 shadow-none focus-visible:ring-0" />{riskDetected && <div className="mt-3 flex gap-2 rounded-lg bg-[#fff1e6] p-3 text-xs leading-5 text-[#82452e]"><AlertTriangle className="mt-0.5 size-4 shrink-0" />此題屬高風險決策；系統僅保存卦象與提供文本導讀，不會給出預測或行動指令。</div>}<div className="mt-5 flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[.14em] text-[#9b6c32]">三錢起卦・由下至上</p><p className="mt-1 text-sm text-[#6e776e]">第 {Math.min(lineValues.length + 1, 6)} 爻　{lineValues.length}/6</p></div><Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 size-4" />重來</Button></div><div className="mt-4 grid grid-cols-6 gap-2">{Array.from({ length: 6 }, (_, index) => { const value = lineValues[index]; const meta = value ? lineMeta(value) : null; return <div key={index} className="min-h-24 rounded-lg border border-[#d6ccbb] bg-[#fffdf8] p-2 text-center"><span className="text-[10px] text-[#7e867e]">{["初", "二", "三", "四", "五", "上"][index]}爻</span>{value ? <><strong className="mt-2 block font-serif text-xl">{value}</strong><span className="block text-[10px] text-[#86632f]">{lineValueLabel(value, index)}{meta?.moving ? "・變" : ""}</span></> : <span className="mt-6 block text-[#bdc3bc]">—</span>}</div>})}</div>{result && <div className="mt-5 rounded-xl bg-[#1f2a25] p-5 text-[#fffaf0]"><p className="text-[10px] font-semibold tracking-[.14em] text-[#e3c791]">已保存至紀錄</p><h3 className="mt-2 font-serif text-2xl">{result.original.name}　→　{result.transformed.name}</h3><p className="mt-2 text-sm text-[#d8ddd7]">下卦 {result.lowerTrigram}　上卦 {result.upperTrigram}　變爻 {result.movingLines.length ? result.movingLines.join("、") : "無"}</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><Button onClick={() => { const snapshot: DivinationSnapshot = { question, lineValues, originalId: result.original.id, originalName: result.original.name, transformedId: result.transformed.id, transformedName: result.transformed.name, movingLines: result.movingLines }; onAiGuide(snapshot); onOpenChange(false); }} className="bg-[#e3c791] text-[#1f2a25] hover:bg-[#f0dba8]"><Sparkles className="mr-2 size-4" />AI 解讀</Button><Button variant="outline" onClick={() => { onOpenOriginal(result.original.id); onOpenChange(false); }} className="border-[#e3c791]/70 bg-transparent text-[#fffaf0] hover:bg-white/10 hover:text-white"><BookOpen className="mr-2 size-4" />原始典籍</Button></div></div>}</div><DialogFooter className="border-t border-[#d9cfbd] px-6 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>回到對話</Button><Button disabled={lineValues.length >= 6 || calculate.isPending} onClick={toss} className="bg-[#1f2a25] text-[#fffaf0] hover:bg-[#33463b]"><Coins className="mr-2 size-4" />{calculate.isPending ? "解圖中…" : lineValues.length >= 6 ? <><Check className="mr-2 size-4" />已完成</> : "投擲三錢"}</Button></DialogFooter></DialogContent></Dialog>;
}
