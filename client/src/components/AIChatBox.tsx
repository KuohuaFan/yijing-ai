import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/lib/chatHistory";
import { AudioLines, Download, FileVideo, ImagePlus, Loader2, Send, Sparkles, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

export type Message = { role: "system" | "user" | "assistant"; content: string };

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isUploading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
  immersive?: boolean;
  attachments?: ChatAttachment[];
  onAttachmentsSelected?: (files: File[]) => void | Promise<void>;
  onRemoveAttachment?: (attachment: ChatAttachment) => void;
  onTranscribeAttachment?: (attachment: ChatAttachment) => void | Promise<void>;
  topContent?: ReactNode;
};

function readableSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AIChatBox({ messages, onSendMessage, isLoading = false, isUploading = false, placeholder = "提出一個關於《易經》原文的問題…", className, height = "600px", emptyStateMessage = "從一段原文、一個卦象或一次起卦開始。", suggestedPrompts, immersive = false, attachments = [], onAttachmentsSelected, onRemoveAttachment, onTranscribeAttachment, topContent }: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const displayMessages = messages.filter((message) => message.role !== "system");
  const scrollToBottom = () => { const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null; viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [displayMessages.length, isLoading]);
  const submit = (event?: React.FormEvent) => { event?.preventDefault(); const value = input.trim(); if (!value || isLoading) return; onSendMessage(value); setInput(""); requestAnimationFrame(() => textareaRef.current?.focus()); };
  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); if (files.length) void onAttachmentsSelected?.(files); event.target.value = ""; };
  const inputClass = immersive ? "rounded-none border-0 bg-transparent px-0 text-base leading-7 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-[#b98e49] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ee]" : "min-h-9";
  return <div ref={scrollAreaRef} className={cn("flex min-h-0 flex-col", immersive ? "bg-transparent text-[#1f2a25]" : "rounded-lg border bg-card text-card-foreground shadow-sm", className)} style={{ height }}>
    <div className="min-h-0 flex-1 overflow-hidden">{displayMessages.length === 0 && !topContent ? <div className={cn("flex h-full flex-col items-center justify-center text-center", immersive ? "px-4" : "p-4")}><Sparkles className="size-8 text-[#b78946]/55" /><p className="mt-4 max-w-md text-sm leading-7 text-[#687168]">{emptyStateMessage}</p>{suggestedPrompts?.length ? <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-3">{suggestedPrompts.map((prompt) => <button key={prompt} disabled={isLoading} onClick={() => onSendMessage(prompt)} className={cn("text-sm text-[#835927] underline decoration-[#c9b07e] underline-offset-4 transition-colors hover:text-[#1f2a25] disabled:opacity-50", !immersive && "rounded-lg border border-border bg-card px-4 py-2 no-underline")}>{prompt}</button>)}</div> : null}</div> : <ScrollArea className="h-full"><div className={cn("mx-auto flex max-w-3xl flex-col", immersive ? "gap-10 px-4 py-8 sm:px-8" : "space-y-4 p-4")}>{topContent && <div className="border-b border-[#cdbb95]/55 pb-5">{topContent}</div>}{displayMessages.map((message, index) => <article key={`${message.role}-${index}`} className={cn(immersive && message.role === "user" ? "border-l-2 border-[#bc914e] pl-5" : "", !immersive && "flex")}>{immersive ? <>{message.role === "user" ? <><p className="text-[10px] font-semibold tracking-[.15em] text-[#a27438]">你所問</p><p className="mt-2 whitespace-pre-wrap font-serif text-2xl leading-relaxed text-[#1f2a25]">{message.content}</p></> : <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-[#1f2a25] prose-p:leading-8 prose-blockquote:border-[#c2a16a] prose-blockquote:text-[#586158]"><Streamdown>{message.content}</Streamdown></div>}</> : <div className={cn("max-w-[80%] rounded-lg px-4 py-2.5", message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Streamdown>{message.content}</Streamdown></div>}</article>)}{isLoading && <div className={cn("flex items-center gap-3 text-sm text-[#687168]", immersive && "px-1")}><Loader2 className="size-4 animate-spin text-[#a27438]" /><span>正在依引文整理導讀…</span></div>}</div></ScrollArea>}</div>
    <form onSubmit={submit} className={cn("mx-auto w-full max-w-3xl", immersive ? "px-4 pb-5 pt-3 sm:px-8" : "border-t bg-background/50 p-4")}>
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={selectFiles} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={selectFiles} />
      <input ref={audioInputRef} type="file" accept="audio/webm,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/mp4" className="sr-only" onChange={selectFiles} />
      {attachments.length > 0 && <div className="mb-3 grid gap-2 sm:grid-cols-2">{attachments.map((attachment) => <div key={`${attachment.id ?? attachment.storageUrl}-${attachment.fileName}`} className="group overflow-hidden rounded-lg bg-[#eee7da]/65 text-xs text-[#4f5b52]">{attachment.kind === "image" ? <a href={attachment.storageUrl} target="_blank" rel="noreferrer" className="block"><img src={attachment.storageUrl} alt={attachment.fileName} className="h-28 w-full object-cover transition-transform group-hover:scale-[1.01]" /></a> : attachment.kind === "video" ? <video controls preload="metadata" className="h-28 w-full bg-[#1f2a25] object-cover"><source src={attachment.storageUrl} type={attachment.mimeType} /></video> : <div className="flex h-20 items-center px-3"><AudioLines className="mr-3 size-5 shrink-0 text-[#a27438]" /><audio controls preload="metadata" className="w-full"><source src={attachment.storageUrl} type={attachment.mimeType} /></audio></div>}<div className="flex min-w-0 items-center gap-2 px-2.5 py-2">{attachment.kind === "image" ? <ImagePlus className="size-3.5 shrink-0 text-[#a27438]" /> : attachment.kind === "video" ? <FileVideo className="size-3.5 shrink-0 text-[#a27438]" /> : <AudioLines className="size-3.5 shrink-0 text-[#a27438]" />}<span className="min-w-0 flex-1 truncate">{attachment.fileName}<span className="ml-1 text-[#8a806f]">{readableSize(attachment.sizeBytes)}</span></span>{attachment.kind === "audio" && !attachment.transcript && attachment.id && <button type="button" onClick={() => void onTranscribeAttachment?.(attachment)} className="text-[10px] text-[#835927] underline underline-offset-2">轉錄</button>}{attachment.kind === "audio" && attachment.transcript && <span className="text-[10px] text-[#6d8b70]">已轉錄</span>}<a href={attachment.storageUrl} download aria-label={`下載 ${attachment.fileName}`} className="rounded-full p-1 text-[#7a5c33] hover:bg-[#ddd0be]"><Download className="size-3.5" /></a><button type="button" aria-label={`移除 ${attachment.fileName}`} onClick={() => onRemoveAttachment?.(attachment)} className="rounded-full p-1 text-[#8a806f] hover:bg-[#ddd0be] hover:text-[#1f2a25]"><X className="size-3.5" /></button></div></div>)}</div>}
      <div className="flex items-end gap-2"><div className={cn("flex shrink-0 items-center gap-0.5 pb-1", immersive && "text-[#8b6740]")}><Button type="button" variant="ghost" size="icon" aria-label="附加圖片" disabled={!onAttachmentsSelected || isUploading} onClick={() => imageInputRef.current?.click()} className="size-8 rounded-full hover:bg-[#eee5d6]"><ImagePlus className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="附加影片" disabled={!onAttachmentsSelected || isUploading} onClick={() => videoInputRef.current?.click()} className="size-8 rounded-full hover:bg-[#eee5d6]"><FileVideo className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="附加或錄製語音" disabled={!onAttachmentsSelected || isUploading} onClick={() => audioInputRef.current?.click()} className="size-8 rounded-full hover:bg-[#eee5d6]"><AudioLines className="size-4" /></Button></div><Textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) submit(event); }} placeholder={placeholder} rows={1} className={cn("min-h-10 max-h-32 flex-1 resize-none", inputClass)} /><Button type="submit" size="icon" disabled={!input.trim() || isLoading || isUploading} className={cn("mb-1 shrink-0", immersive ? "rounded-full bg-[#1f2a25] text-[#fffaf0] hover:bg-[#33463b]" : "h-[38px] w-[38px]")}>{isUploading || isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div>
      {isUploading && <p className="mt-1.5 pl-1 text-[10px] text-[#8b6740]">正在安全保存附件…</p>}
    </form>
  </div>;
}
