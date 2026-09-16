import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ClipboardCopy, Compass, Facebook, FileDown, FileText, Instagram, Save, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { ChatToolMenu } from "@/components/ChatToolMenu";
import { DivinationInChat } from "@/components/DivinationInChat";
import { HistoryRail } from "@/components/HistoryRail";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandMark";
import {
  createChatRecord,
  deriveChatTitle,
  loadChatRecords,
  persistChatRecords,
  type ChatAttachment,
  type ChatRecord,
  type DivinationSnapshot,
} from "@/lib/chatHistory";
import { downloadRecord, downloadRecordWord, openRecordPrintView, recordSharePayload } from "@/lib/recordExport";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const prompts = [
  "請解釋乾卦九三的「終日乾乾」",
  "《彖傳》如何解釋坤卦？",
  "比較既濟與未濟的結構",
  "「利貞」在易經中可以如何閱讀？",
];

const localLimits = {
  image: 10 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
} as const;

function mediaKind(file: File): ChatAttachment["kind"] | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("無法讀取此附件。"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

function guideQuestion(snapshot: DivinationSnapshot) {
  return snapshot.question
    ? `請以本次起卦的${snapshot.originalName}卦為中心，導讀我所問的問題：${snapshot.question}`
    : `請以本次起卦的${snapshot.originalName}卦為中心，依原文完成六段式導讀。`;
}

function visibleMessagesForRecord(record: ChatRecord) {
  if (!record.divination) return record.messages;

  const marker = `本次起卦的${record.divination.originalName}卦`;
  const lastGuideQuestion = record.messages.reduce((found, message, index) => (
    message.role === "user" && message.content.includes(marker) ? index : found
  ), -1);
  const candidates = record.messages
    .slice(lastGuideQuestion >= 0 ? lastGuideQuestion : 0)
    .filter((message) => !(message.role === "assistant" && message.content.startsWith("## 起卦紀錄")));
  const lastGuide = candidates.reduce((found, message, index) => (
    message.role === "assistant" && message.content.startsWith("## 1. 文本定位") ? index : found
  ), -1);

  return candidates.filter((message, index) => (
    !(message.role === "assistant" && message.content.startsWith("## 1. 文本定位")) || index === lastGuide
  ));
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [records, setRecords] = useState<ChatRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [divinationOpen, setDivinationOpen] = useState(false);

  useEffect(() => {
    document.title = "易經 AI｜三錢卜卦、六十四卦原典導讀、變爻解圖與可追溯反思工作台";
  }, []);

  useEffect(() => {
    const saved = loadChatRecords();
    const initial = saved.length ? saved : [createChatRecord()];
    setRecords(initial);
    setActiveId(initial[0].id);
    setShowLanding(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) persistChatRecords(records);
  }, [ready, records]);

  const active = useMemo(
    () => records.find((record) => record.id === activeId) ?? records[0],
    [records, activeId],
  );
  const visibleMessages = useMemo(() => active ? visibleMessagesForRecord(active) : [], [active]);

  const patchActive = (patch: (record: ChatRecord) => ChatRecord) => {
    setRecords((current) => current.map((record) => (record.id === active?.id ? patch(record) : record)));
  };

  const addMessage = (message: Message) => {
    patchActive((record) => {
      const messages = [...record.messages, message];
      return { ...record, messages, title: deriveChatTitle(messages, record.title), updatedAt: Date.now() };
    });
  };

  const guide = trpc.guide.create.useMutation({
    onSuccess: (data) => patchActive((record) => {
      const messages = [...record.messages, { role: "assistant" as const, content: data.content }];
      return { ...record, messages, citations: data.citations ?? record.citations, title: deriveChatTitle(messages, record.title), updatedAt: Date.now() };
    }),
    onError: () => addMessage({ role: "assistant", content: "目前無法完成導讀，請稍後再試，或先進入讀本查閱原文。" }),
  });
  const mediaUpload = trpc.media.upload.useMutation();
  const transcribe = trpc.media.transcribe.useMutation();
  const createShare = trpc.share.create.useMutation();
  const revokeShare = trpc.share.revoke.useMutation();

  const ensureShareLink = async () => {
    if (!active) return;
    if (!isAuthenticated) {
      toast.info("建立可撤銷分享連結前，請先登入。 ");
      startLogin();
      return;
    }
    if (active.share) return `${window.location.origin}/share/${active.share.token}`;
    const share = await createShare.mutateAsync({
      title: active.title,
      payload: recordSharePayload(active, false),
      includesAttachments: false,
      expiresInDays: 30,
    });
    patchActive((record) => ({ ...record, share: { id: share.id, token: share.token, expiresAt: share.expiresAt }, updatedAt: Date.now() }));
    return `${window.location.origin}/share/${share.token}`;
  };

  const send = (content: string) => {
    const transcriptContext = (active?.attachments ?? [])
      .filter((attachment) => attachment.kind === "audio" && attachment.transcript)
      .map((attachment) => `【語音逐字稿：${attachment.fileName}】\n${attachment.transcript}`)
      .join("\n\n");
    addMessage({ role: "user", content });
    guide.mutate({ question: transcriptContext ? `${content}\n\n${transcriptContext}` : content });
  };

  const launchDivinationGuide = (snapshot: DivinationSnapshot) => {
    const question = guideQuestion(snapshot);
    if (active?.messages.at(-1)?.content !== question) addMessage({ role: "user", content: question });
    guide.mutate({ question, lineValues: snapshot.lineValues as (6 | 7 | 8 | 9)[] });
  };

  const uploadFiles = async (files: File[]) => {
    if (!active) return;
    if (!isAuthenticated) {
      toast.info("附件會保存到個人書架，請先登入後再上傳。");
      startLogin();
      return;
    }

    for (const file of files) {
      const kind = mediaKind(file);
      if (!kind || !file.type) {
        toast.error(`${file.name} 並非支援的圖片、影片或音訊格式。`);
        continue;
      }
      if (file.size > localLimits[kind]) {
        toast.error(`${file.name} 超過 ${kind === "video" ? "25" : kind === "audio" ? "16" : "10"} MB 上限。`);
        continue;
      }

      try {
        const saved = await mediaUpload.mutateAsync({
          chatRecordKey: active.id,
          kind,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          base64: await toBase64(file),
        });
        const attachment: ChatAttachment = {
          id: saved.id,
          kind: saved.kind,
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          storageUrl: saved.storageUrl,
          transcript: saved.transcript,
          transcriptSegments: saved.transcriptSegments,
        };
        patchActive((record) => ({
          ...record,
          attachments: [...(record.attachments ?? []), attachment],
          updatedAt: Date.now(),
        }));
        toast.success(`${file.name} 已保存至這則研讀紀錄。`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "附件上傳失敗，請稍後再試。");
      }
    }
  };

  const transcribeAttachment = async (attachment: ChatAttachment) => {
    if (!attachment.id) return;
    try {
      const updated = await transcribe.mutateAsync({ attachmentId: attachment.id });
      patchActive((record) => ({
        ...record,
        attachments: (record.attachments ?? []).map((item) =>
          item.id === attachment.id
            ? { ...item, transcript: updated.transcript, transcriptSegments: updated.transcriptSegments }
            : item,
        ),
        updatedAt: Date.now(),
      }));
      toast.success("逐字稿已加入這則研讀紀錄；送出問題時會作為文本材料。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "語音轉錄失敗，請稍後再試。");
    }
  };

  const selectRecord = (id: string) => {
    setActiveId(id);
    setShowLanding(false);
  };

  const newChat = () => {
    const record = createChatRecord();
    setRecords((current) => [record, ...current]);
    setActiveId(record.id);
    setShowLanding(false);
  };

  const removeChat = () => {
    if (!active) return;
    setRecords((current) => {
      const next = current.filter((record) => record.id !== active.id);
      if (!next.length) {
        const fresh = createChatRecord();
        setActiveId(fresh.id);
        return [fresh];
      }
      setActiveId(next[0].id);
      return next;
    });
    setShowLanding(false);
  };

  const shareChat = async () => {
    try {
      const url = await ensureShareLink();
      if (!url || !active) return;
      if (navigator.share) await navigator.share({ title: active.title, text: "《易經》研讀快照", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("30 天有效的唯讀分享連結已複製。");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") toast.error("無法建立分享連結，請稍後再試。");
    }
  };

  const copyGuide = async () => {
    const latestGuide = [...visibleMessages].reverse().find((message) => message.role === "assistant")?.content;
    if (!latestGuide) return toast.info("尚無可複製的導讀內容。 ");
    await navigator.clipboard.writeText(latestGuide);
    toast.success("最新導讀內容已複製。 ");
  };

  const shareToFacebook = async () => {
    try {
      const url = await ensureShareLink();
      if (!url) return;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("無法建立分享連結，請稍後再試。 ");
    }
  };

  const shareToInstagram = async () => {
    try {
      const url = await ensureShareLink();
      if (!url || !active) return;
      if (navigator.share) await navigator.share({ title: active.title, text: "《易經》研讀快照", url });
      else {
        await navigator.clipboard.writeText(url);
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        toast.success("分享連結已複製；請在 Instagram 內自行選擇貼文或限時動態。 ");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") toast.error("無法開啟裝置分享，請稍後再試。 ");
    }
  };

  const revokeActiveShare = async () => {
    if (!active?.share) return;
    try {
      await revokeShare.mutateAsync({ id: active.share.id });
      patchActive((record) => ({ ...record, share: undefined, updatedAt: Date.now() }));
      toast.success("唯讀分享連結已撤銷。");
    } catch {
      toast.error("無法撤銷分享連結，請稍後再試。");
    }
  };

  const completeDivination = (snapshot: DivinationSnapshot, message: string) => {
    const record = createChatRecord({
      title: `${snapshot.originalName}卦・起卦紀錄`,
      divination: snapshot,
      messages: [{ role: "assistant", content: message }],
    });
    setRecords((current) => [record, ...current]);
    setActiveId(record.id);
    setShowLanding(false);
    toast.success("卦象已留在這則對話與左側紀錄。");
  };

  if (!ready || !active) return <div className="min-h-screen bg-[#f8f5ee]" />;

  const divination = active.divination;
  const chatHeight = "calc(100vh - 7.5rem)";

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[#1f2a25]">
      <div className="pointer-events-none fixed inset-0 opacity-50 grain-overlay" />
      <HistoryRail
        records={records}
        activeId={active.id}
        onSelect={selectRecord}
        onNew={newChat}
        onDelete={removeChat}
        onStar={() => patchActive((record) => ({ ...record, starred: !record.starred, updatedAt: Date.now() }))}
        onProject={(project) => {
          patchActive((record) => ({ ...record, project, updatedAt: Date.now() }));
          toast.success(`已加入「${project}」專案。`);
        }}
        onTag={(tag) => {
          patchActive((record) => {
            const tags = record.tags ?? [];
            const nextTags = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag].slice(0, 8);
            return { ...record, tags: nextTags, updatedAt: Date.now() };
          });
          toast.success(`已更新標籤 #${tag}。`);
        }}
        onSave={() => {
          persistChatRecords(records);
          toast.success("此瀏覽器中的研讀歷程已保存。");
        }}
        onShare={shareChat}
        onRevokeShare={revokeActiveShare}
        onDownloadMarkdown={() => downloadRecord(active, "markdown")}
        onDownloadJson={() => downloadRecord(active, "json")}
        onPrint={() => {
          if (!openRecordPrintView(active)) toast.error("瀏覽器阻擋了列印視窗，請允許彈出視窗後再試。");
        }}
        isAuthenticated={isAuthenticated}
        onLogin={startLogin}
      />
      <ChatToolMenu onDivine={() => { setShowLanding(false); setDivinationOpen(true); }} />

      <main className="relative flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-2 pt-20 sm:px-8">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[.18em] text-[#9a7442]">
            <BrandIcon className="size-7" /> 觀易・文本導讀
          </div>

          {showLanding ? (
            <section className="flex flex-1 flex-col items-center justify-center pb-12 text-center">
              <p className="text-[10px] font-semibold tracking-[.18em] text-[#9a7442]">觀象・玩辭・觀變</p>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-[#1b2922] sm:text-6xl">
                從一個問題開始<br />
                <span className="text-[#ad6f28]">讓原文與卦象在場</span>
              </h1>
              <h2 className="mt-4 max-w-xl text-lg font-medium leading-7 text-[#4b584f] sm:text-xl">
                以易經原典、卦象與 AI 導讀展開可追溯的數位反思
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#606a61] sm:text-base">
                把《易經》原文、卦象結構與來源明示的 AI 導讀放在同一個沉浸式工作區。你可以先起一卦，或直接輸入原典問題。
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button onClick={() => { setShowLanding(false); setDivinationOpen(true); }} size="lg" className="bg-[#1f2a25] px-7 text-[#fffaf0] hover:bg-[#33463b]">
                  <Compass className="mr-2 size-4" />起一卦
                </Button>
                <Button onClick={() => setLocation("/bazi")} size="lg" variant="outline" className="border-[#c9b07e] bg-[#fffdf8]/70 px-6 text-[#6e522a] hover:bg-[#f3ead9]">
                  <CalendarDays className="mr-2 size-4" />排八字／看流年
                </Button>
                <Button onClick={() => setLocation("/poetry-lot")} size="lg" variant="outline" className="border-[#c9b07e] bg-[#fffdf8]/70 px-6 text-[#6e522a] hover:bg-[#f3ead9]">
                  <FileText className="mr-2 size-4" />解詩籤
                </Button>
              </div>
              <p className="mt-5 text-xs text-[#8b7658]">排八字／流年與詩籤研究可直接由上方進入；讀本、查卦、十翼與個人書架，請由右上功能選單開啟。</p>
              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-3">
                {prompts.slice(1).map((prompt) => (
                  <button key={prompt} onClick={() => { setShowLanding(false); send(prompt); }} className="text-sm text-[#835927] underline decoration-[#c9b07e] underline-offset-4 hover:text-[#1f2a25]">
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <AIChatBox
                messages={visibleMessages}
                onSendMessage={send}
                isLoading={guide.isPending}
                isUploading={mediaUpload.isPending || transcribe.isPending}
                attachments={active.attachments ?? []}
                onAttachmentsSelected={uploadFiles}
                onRemoveAttachment={(attachment) => patchActive((record) => ({
                  ...record,
                  attachments: (record.attachments ?? []).filter((item) => item.storageUrl !== attachment.storageUrl),
                  updatedAt: Date.now(),
                }))}
                onTranscribeAttachment={transcribeAttachment}
                immersive
                height={visibleMessages.length ? chatHeight : "18rem"}
                topContent={divination ? <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold tracking-[.16em] text-[#9a7442]">本次起卦</p><p className="mt-1 font-serif text-xl font-semibold text-[#203027]">{divination.originalName}卦 <span className="text-sm font-normal text-[#6f786f]">第 {divination.originalId} 卦</span></p><p className="mt-1 text-xs text-[#687269]">{divination.movingLines.length ? `變爻：第 ${divination.movingLines.join("、")} 爻；之卦 ${divination.transformedName}` : "本次未見變爻"}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => launchDivinationGuide(divination)} disabled={guide.isPending} className="bg-[#1f2a25] text-[#fffaf0] hover:bg-[#33463b]"><Sparkles className="mr-1.5 size-3.5" />AI 解讀</Button><Button type="button" size="sm" variant="outline" onClick={() => setLocation(`/reader/${divination.originalId}`)} className="border-[#cbb98f] text-[#6e522a] hover:bg-[#f3ead9]"><BookOpen className="mr-1.5 size-3.5" />原典卦文</Button></div></div> : undefined}
                placeholder="例如：請解釋乾卦九三的語義脈絡…"
                emptyStateMessage="選擇上方任一入口，或直接提出你的問題。"
              />
              {visibleMessages.length > 0 && (
                <section className="pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                  <div className="rounded-2xl border border-[#d9cfbd] bg-[#fffdf8]/90 p-3 shadow-[0_8px_24px_rgba(31,42,37,.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold tracking-[.14em] text-[#9a7442]">導讀交付</p><p className="text-[10px] text-[#899088]">AI 僅作文本導讀；回應均以可追溯原文為依據。</p></div>
                    <div className="mt-3 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => { persistChatRecords(records); toast.success("此瀏覽器中的研讀歷程已保存。 "); }} className="justify-center"><Save className="mr-1 size-3.5" />存檔</Button>
                      <Button size="sm" variant="outline" onClick={copyGuide} className="justify-center"><ClipboardCopy className="mr-1 size-3.5" />複製</Button>
                      <Button size="sm" variant="outline" onClick={() => downloadRecordWord(active)} className="justify-center"><FileText className="mr-1 size-3.5" />Word</Button>
                      <Button size="sm" variant="outline" onClick={() => { if (!openRecordPrintView(active)) toast.error("瀏覽器阻擋了列印視窗，請允許彈出視窗後再試。 "); }} className="justify-center"><FileDown className="mr-1 size-3.5" />PDF</Button>
                      <Button size="sm" variant="outline" onClick={shareChat} className="justify-center"><Share2 className="mr-1 size-3.5" />分享</Button>
                      <Button size="sm" variant="outline" onClick={shareToFacebook} className="justify-center"><Facebook className="mr-1 size-3.5" />Facebook</Button>
                      <Button size="sm" variant="outline" onClick={shareToInstagram} className="justify-center"><Instagram className="mr-1 size-3.5" />IG</Button>
                    </div>
                    <p className="mt-3 text-[10px] leading-5 text-[#899088]">分享會建立 30 天可撤銷的唯讀連結；Facebook 只開啟分享對話框，Instagram 使用您的裝置分享面板或複製連結，發佈均由您自行確認。</p>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <DivinationInChat
        open={divinationOpen}
        onOpenChange={setDivinationOpen}
        onComplete={completeDivination}
        onAiGuide={launchDivinationGuide}
        onOpenOriginal={(hexagramId) => setLocation(`/reader/${hexagramId}`)}
      />
    </div>
  );
}
