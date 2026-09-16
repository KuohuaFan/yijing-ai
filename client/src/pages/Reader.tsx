import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Copy, MessageSquarePlus, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { HexagramDiagram } from "@/components/HexagramDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { textSections } from "@/lib/yijing";
import { firstCommentarySources } from "@/lib/commentarySources";
import { toast } from "sonner";

export default function Reader() {
  const [, params] = useRoute("/reader/:id");
  const id = Math.max(1, Math.min(64, Number(params?.id ?? 1)));
  const { isAuthenticated } = useAuth();
  const reading = trpc.library.hexagram.useQuery({ id });
  const [question, setQuestion] = useState("");
  const [selectedAnchor, setSelectedAnchor] = useState("");
  const [commentator, setCommentator] = useState("我的研讀註解");
  const [versionLabel, setVersionLabel] = useState("使用者註解");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const guide = trpc.guide.create.useMutation();
  const annotations = trpc.commentary.list.useQuery(
    { anchor: selectedAnchor || `zhouyi-${id}` },
    { enabled: Boolean(selectedAnchor) },
  );
  const annotationCreate = trpc.commentary.create.useMutation({
    onSuccess: () => {
      annotations.refetch();
      setBody("");
      toast.success("段落註解已保存。 ");
    },
  });
  const sections = useMemo(
    () => (reading.data ? textSections(reading.data.hexagram.fullText, reading.data.hexagram.name, reading.data.hexagram.anchor) : []),
    [reading.data],
  );

  useEffect(() => {
    if (!reading.data || !window.location.hash) return;
    const anchor = decodeURIComponent(window.location.hash.slice(1));
    const timer = window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: "start", behavior: "instant" }), 0);
    return () => window.clearTimeout(timer);
  }, [reading.data]);

  if (reading.isLoading) {
    return <div className="min-h-screen bg-[#f8f5ee]"><SiteHeader /><main className="container py-20 text-[#657066]">正在展開讀本…</main></div>;
  }
  if (!reading.data) {
    return <div className="min-h-screen bg-[#f8f5ee]"><SiteHeader /><main className="container py-20">找不到此卦。</main></div>;
  }

  const { hexagram, citations } = reading.data;
  const activeAnchor = selectedAnchor || sections[0]?.anchor || hexagram.anchor;
  const activeSection = sections.find((section) => section.anchor === activeAnchor) ?? sections[0];
  const canSaveAnnotation = Boolean(body.trim());
  const canCreateGuide = question.trim().length >= 2;

  const saveAnnotation = () => {
    if (!isAuthenticated) return startLogin();
    if (!canSaveAnnotation) return toast.error("請先輸入註解內容。 ");
    annotationCreate.mutate({
      anchor: activeAnchor,
      commentator: commentator.trim() || "我的研讀註解",
      versionLabel: versionLabel.trim() || "使用者註解",
      body: body.trim(),
      visibility,
    });
  };

  const createGuide = () => {
    if (!canCreateGuide) return;
    guide.mutate({
      question: question.trim(),
      lineValues: hexagram.lines.split("").map((item) => (item === "1" ? 7 : 8)) as [6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9],
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]">
      <SiteHeader />
      <main className="container pb-[calc(9rem+env(safe-area-inset-bottom))] pt-9 sm:py-9">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/library" className="inline-flex items-center gap-2 text-sm text-[#6b746b] hover:text-[#1f2a25]"><ArrowLeft className="size-4" />返回讀本</Link>
          <div className="flex gap-2">
            <Link href={`/reader/${id === 1 ? 64 : id - 1}`}><Button variant="outline" size="sm" className="border-[#c9b485]">前一卦</Button></Link>
            <Link href={`/reader/${id === 64 ? 1 : id + 1}`}><Button variant="outline" size="sm" className="border-[#c9b485]">後一卦</Button></Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="rounded-2xl border border-[#24342c]/10 bg-[#fffdf8] p-6 md:p-10">
            <header className="flex flex-col justify-between gap-6 border-b border-[#e1d7c4] pb-8 sm:flex-row">
              <div>
                <p className="eyebrow">上經／下經・第 {hexagram.id} 卦</p>
                <h1 className="mt-2 font-serif text-5xl font-semibold">{hexagram.name}</h1>
                <p className="mt-3 text-sm leading-7 text-[#697269]">選取任一段落，即可在右側建立可署名的注家對讀與協作註解。</p>
              </div>
              <HexagramDiagram pattern={hexagram.lines} name={hexagram.name} number={hexagram.id} />
            </header>

            <div className="mt-9 grid gap-8">
              {sections.map((section) => (
                <section id={section.anchor} key={section.anchor} className="scroll-mt-28">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><span className="h-px w-7 bg-[#b78950]" /><h2 className="font-serif text-2xl font-semibold">{section.title}</h2></div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedAnchor(section.anchor)} className="text-xs text-[#815924]"><MessageSquarePlus className="mr-1 size-3.5" />對讀／註解</Button>
                  </div>
                  <p className="whitespace-pre-wrap font-serif text-[17px] leading-9 text-[#303b33]">{section.content}</p>
                  <p className="mt-4 text-[11px] tracking-wide text-[#8a806f]">錨點：#{section.anchor}　版本：{hexagram.versionLabel}</p>
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#cbb98f]/60 bg-[#f3eee2] p-5">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9a6d30]">注家版本對讀</p>
              <h2 className="mt-2 font-serif text-xl">{activeSection?.title || "選取段落"}</h2>
              <p className="mt-2 whitespace-pre-wrap border-l-2 border-[#b78950] pl-3 text-sm leading-6 text-[#485248]">{activeSection?.content}</p>
              <div className="mt-4 grid gap-2">
                {firstCommentarySources.map((source) => (
                  <a key={source.id} href={source.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#d7c9ad] bg-[#fcfaf4] p-3 transition-colors hover:bg-[#f8f1df]">
                    <p className="text-xs font-semibold text-[#664b2c]">{source.commentator}・{source.versionLabel}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#5e685f]">{source.approach}</p>
                    <p className="mt-1 text-[10px] text-[#8a806f]">{source.sourceName}</p>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[#8a806f]">以上為來源與版本欄位；完整注文僅於取得可重製底本後逐段導入。</p>

              <div className="mt-4 space-y-3">
                {annotations.data?.length ? annotations.data.map((note) => (
                  <div key={note.id} className="rounded-xl border border-[#d7c9ad] bg-[#fcfaf4] p-3">
                    <p className="text-xs font-semibold text-[#664b2c]">{note.commentator}・{note.versionLabel}</p>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#5e685f]">{note.body}</p>
                    <p className="mt-2 text-[10px] text-[#8a806f]">{note.visibility === "shared" ? "共享註解" : "私人註解"}</p>
                  </div>
                )) : <p className="text-xs leading-5 text-[#7c847b]">尚無註解。可建立自己的校讀筆記，或選擇分享給協作者。</p>}
              </div>

              <div className="mt-4 border-t border-[#d7c9ad] pt-4">
                <Input value={commentator} onChange={(event) => setCommentator(event.target.value)} placeholder="注家或作者名稱" className="h-9 border-[#d8cdb9] text-xs" />
                <Input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="版本標示" className="mt-2 h-9 border-[#d8cdb9] text-xs" />
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="寫下對本段的對讀、校記或反思…" className="mt-2 min-h-24 border-[#d8cdb9] text-xs" />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant={visibility === "private" ? "default" : "outline"} onClick={() => setVisibility("private")}>私人</Button>
                  <Button size="sm" variant={visibility === "shared" ? "default" : "outline"} onClick={() => setVisibility("shared")}>共享</Button>
                  <Button size="sm" disabled={!canSaveAnnotation || annotationCreate.isPending} onClick={saveAnnotation} className="ml-auto bg-[#1f2a25] text-[#fffaf0]">保存註解</Button>
                </div>
                {!canSaveAnnotation && <p className="mt-2 text-[11px] leading-5 text-[#8a806f]">請先輸入註解內容；登入後才可保存至個人帳號。</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-[#1f2a25] p-5 text-[#f8f5ea]">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#d5b680]">文本導讀</p>
              <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={`例如：${hexagram.name}卦的結構如何閱讀？`} className="mt-3 min-h-20 border-white/15 bg-white/10 text-sm text-white placeholder:text-[#c4cec5]" />
              <Button disabled={!canCreateGuide || guide.isPending} onClick={createGuide} className="mt-3 w-full bg-[#d5b680] text-[#273129]"><Sparkles className="mr-2 size-4" />{guide.isPending ? "整理中…" : "生成六段導讀"}</Button>
              {!canCreateGuide && <p className="mt-2 text-[11px] leading-5 text-[#c4cec5]">請先輸入至少 2 個字的研讀問題，按鍵才會啟用。</p>}
              {guide.data && <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f8f5ee] p-4 font-sans text-xs leading-6 text-[#26342b]">{guide.data.content}</pre>}
            </div>

            <div className="rounded-2xl border border-[#cbb98f]/60 bg-[#f3eee2] p-5">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9a6d30]">本頁引文</p>
              <div className="mt-3 grid gap-3">
                {citations.map((citation) => (
                  <div key={citation.anchor} className="rounded-lg border border-[#d7c9ad] bg-[#fcfaf4] p-3">
                    <p className="text-xs font-semibold text-[#664b2c]">{citation.label}</p>
                    <p className="mt-2 text-xs leading-5 text-[#5e685f]">{citation.excerpt}</p>
                    <p className="mt-2 text-[10px] text-[#8a806f]">{citation.versionLabel}</p>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="mt-3 w-full text-xs text-[#79603f]" onClick={() => navigator.clipboard.writeText(`${hexagram.name}・第 ${hexagram.id} 卦\n${hexagram.sourceUrl}`)}><Copy className="mr-2 size-3.5" />複製本頁引用</Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
