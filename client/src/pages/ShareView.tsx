import { Link, useParams } from "wouter";
import { ExternalLink, FileText, Loader2, LockKeyhole } from "lucide-react";
import { Streamdown } from "streamdown";
import { BrandMark } from "@/components/BrandMark";
import { trpc } from "@/lib/trpc";
import type { ChatRecord } from "@/lib/chatHistory";

type BaziResearchSnapshot = {
  kind?: string;
  disclosure?: string;
  pillars?: Array<{ label: string; value: string }>;
  dayMaster?: string;
  dayMasterElement?: string;
  hiddenStems?: Record<string, string>;
  tenGods?: Record<string, string>;
  elementCounts?: Record<string, number>;
  conventions?: { calendar?: string; dayBoundary?: string; timezoneNotice?: string; engine?: string };
  annual?: { year?: number; ganZhi?: string; reference?: string };
  daYun?: {
    direction?: string;
    preStart?: { startYear: number; endYear: number; startAge: number; endAge: number };
    periods?: Array<{ index: number; ganZhi?: string; startYear: number; endYear: number; startAge: number; endAge: number }>;
    currentPeriod?: { index?: number };
    conventions?: { startMethod?: string; pillarMethod?: string; ruleVersion?: string };
  };
  researchGuide?: string;
};

function ShareBrandHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-[#d7c7aa] pb-5">
      <BrandMark className="mb-5" />
      <p className="text-[10px] font-semibold tracking-[.16em] text-[#9a7442]">觀易・唯讀分享</p>
      <h1 className="mt-3 font-serif text-4xl">{title}</h1>
      <p className="mt-3 text-xs text-[#6d776e]">此為研讀紀錄快照；分享者仍可隨時撤銷連結。</p>
    </div>
  );
}

function BaziSnapshotView({ snapshot }: { snapshot: BaziResearchSnapshot }) {
  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-xl border border-[#d7c7aa] bg-[#f3eee2] p-4 text-sm leading-6 text-[#5a604f]">
        <LockKeyhole className="mr-2 inline size-4 text-[#9a7442]" />
        {snapshot.disclosure}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {snapshot.pillars?.map((pillar) => (
          <article key={pillar.label} className="rounded-xl bg-[#1f2a25] p-4 text-center text-[#fffaf0]">
            <p className="text-xs text-[#e3c791]">{pillar.label}</p>
            <p className="mt-2 font-serif text-2xl">{pillar.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-[#d7c7aa] bg-white p-5">
          <h2 className="font-serif text-xl">結構資料</h2>
          <p className="mt-2 text-sm leading-6">日主：{snapshot.dayMaster}（{snapshot.dayMasterElement}）</p>
          <p className="text-sm leading-6">可見五行：{snapshot.elementCounts ? Object.entries(snapshot.elementCounts).map(([key, value]) => `${key}${value}`).join("、") : "未提供"}</p>
          <p className="mt-2 text-sm leading-6">十神：{snapshot.tenGods ? Object.entries(snapshot.tenGods).map(([key, value]) => `${key}${value}`).join("、") : "未提供"}</p>
        </section>
        <section className="rounded-xl border border-[#d7c7aa] bg-white p-5">
          <h2 className="font-serif text-xl">流年與慣例</h2>
          <p className="mt-2 font-serif text-2xl">{snapshot.annual?.year}　{snapshot.annual?.ganZhi}</p>
          <p className="mt-2 text-sm leading-6 text-[#5a604f]">{snapshot.annual?.reference}</p>
          <p className="mt-2 text-xs leading-5 text-[#6d776e]">{snapshot.conventions?.calendar}；{snapshot.conventions?.dayBoundary}；{snapshot.conventions?.timezoneNotice}</p>
        </section>
      </div>
      {snapshot.daYun && (
        <section className="rounded-xl border border-[#d7c7aa] bg-white p-5">
          <p className="text-[10px] font-semibold tracking-[.16em] text-[#9a7442]">大運結構時間軸</p>
          <h2 className="mt-2 font-serif text-xl">{snapshot.daYun.direction}｜十年柱位</h2>
          <p className="mt-2 text-sm leading-6 text-[#5a604f]">{snapshot.daYun.conventions?.startMethod}；{snapshot.daYun.conventions?.pillarMethod}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {snapshot.daYun.periods?.map((period) => (
              <article key={period.index} className={snapshot.daYun?.currentPeriod?.index === period.index ? "rounded-lg border border-[#a27438] bg-[#fff8e9] p-3" : "rounded-lg border border-[#e0d6c5] p-3"}>
                <p className="font-serif text-lg text-[#5c4321]">{period.ganZhi}</p>
                <p className="mt-1 text-xs text-[#6d776e]">{period.startYear}–{period.endYear}；虛歲 {period.startAge}–{period.endAge}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#6d776e]">此分享不含起運精確日期、出生資料或傳統性別參數。</p>
        </section>
      )}
      {snapshot.researchGuide && (
        <section className="rounded-xl border border-[#d7c7aa] bg-white p-5">
          <p className="text-[10px] font-semibold tracking-[.16em] text-[#9a7442]">受限研究解說</p>
          <div className="prose prose-stone mt-3 max-w-none prose-headings:font-serif prose-p:leading-8">
            <Streamdown>{snapshot.researchGuide}</Streamdown>
          </div>
        </section>
      )}
    </section>
  );
}

function ResearchRecordView({ record, includesAttachments }: { record: ChatRecord; includesAttachments: boolean }) {
  return (
    <>
      {record.divination && (
        <section className="mt-8 rounded-xl bg-[#1f2a25] p-5 text-[#fffaf0]">
          <p className="text-[10px] tracking-[.14em] text-[#e3c791]">起卦快照</p>
          <h2 className="mt-2 font-serif text-2xl">{record.divination.originalName}　→　{record.divination.transformedName}</h2>
          <p className="mt-2 text-sm text-[#d8ddd7]">六爻（下至上）：{record.divination.lineValues.join("、")}　變爻：{record.divination.movingLines.length ? record.divination.movingLines.join("、") : "無"}</p>
        </section>
      )}
      <section className="mt-9 space-y-8">
        {record.messages?.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === "user" ? "border-l-2 border-[#bc914e] pl-5" : ""}>
            {message.role === "user" ? (
              <>
                <p className="text-[10px] font-semibold tracking-[.15em] text-[#a27438]">你所問</p>
                <p className="mt-2 whitespace-pre-wrap font-serif text-2xl leading-relaxed">{message.content}</p>
              </>
            ) : (
              <div className="prose prose-stone max-w-none prose-headings:font-serif prose-p:leading-8"><Streamdown>{message.content}</Streamdown></div>
            )}
          </div>
        ))}
      </section>
      {includesAttachments && record.attachments?.length ? (
        <section className="mt-10 border-t border-[#d7c7aa] pt-6">
          <h2 className="font-serif text-2xl">附件</h2>
          <div className="mt-4 grid gap-2">
            {record.attachments.map((attachment) => (
              <a key={attachment.storageUrl} href={attachment.storageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-[#eee7da] px-3 py-3 text-sm hover:bg-[#e5dac6]">
                <FileText className="size-4 text-[#9a7442]" />{attachment.fileName}<ExternalLink className="ml-auto size-4" />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function ShareView() {
  const { token } = useParams<{ token: string }>();
  const share = trpc.share.view.useQuery({ token: token ?? "" }, { enabled: Boolean(token), retry: false });

  if (share.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#f8f5ee] text-[#526056]"><Loader2 className="size-6 animate-spin" /></div>;
  }
  if (share.error || !share.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8f5ee] px-6 text-center">
        <div>
          <BrandMark className="mb-6 justify-center" />
          <LockKeyhole className="mx-auto size-7 text-[#a27438]" />
          <h1 className="mt-4 font-serif text-3xl text-[#1f2a25]">此分享連結已不可使用</h1>
          <p className="mt-3 text-sm leading-6 text-[#687168]">它可能已過期、被撤銷或不存在。</p>
          <Link href="/" className="mt-6 inline-block text-sm text-[#835927] underline underline-offset-4">回到觀易</Link>
        </div>
      </div>
    );
  }

  const snapshot = share.data.payload as BaziResearchSnapshot;
  const record = share.data.payload as unknown as ChatRecord;
  const isBaziSnapshot = snapshot.kind === "bazi_research_snapshot";

  return (
    <main className="min-h-screen bg-[#f8f5ee] px-5 py-10 text-[#1f2a25] sm:px-8">
      <article className="mx-auto max-w-3xl">
        <ShareBrandHeader title={share.data.title} />
        {isBaziSnapshot ? <BaziSnapshotView snapshot={snapshot} /> : <ResearchRecordView record={record} includesAttachments={share.data.includesAttachments} />}
        <footer className="mt-12 border-t border-[#d7c7aa] pt-4 text-xs leading-6 text-[#707971]">本紀錄供《易經》與相關文本研讀、文化理解及反思使用，不構成預測或專業意見。</footer>
      </article>
    </main>
  );
}
