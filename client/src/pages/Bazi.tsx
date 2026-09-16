import { useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronUp, LockKeyhole, Scale, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBaziMarginalia } from "@/lib/baziCommentary";
import { trpc } from "@/lib/trpc";

const researchTerms = [
  ["日主", "以日干作為全盤關係的閱讀參照；不等同人格定論或強弱結論。"],
  ["十神", "依其他天干相對於日主的五行與陰陽關係所作的傳統標記。"],
  ["藏干", "地支中傳統上所列的天干資訊；可用於補讀未顯於天干的層次。"],
  ["流年", "與原局並讀的年度干支標記；不代表個人事件機率或吉凶結果。"],
] as const;

function guideSections(content: string) {
  return content.split(/^## /m).filter(Boolean).map((block) => {
    const [heading, ...body] = block.split("\n");
    return { title: heading.replace(/^\d+\.\s*/, ""), body: body.join("\n").trim() };
  });
}

export default function Bazi() {
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [sect, setSect] = useState<1 | 2>(2);
  const [daYunGender, setDaYunGender] = useState<"male" | "female" | undefined>();
  const [daYunSect, setDaYunSect] = useState<1 | 2 | undefined>();
  const [consent, setConsent] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [observation, setObservation] = useState("");
  const [uncertainty, setUncertainty] = useState("");
  const [guideQuestion, setGuideQuestion] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [profileLabel, setProfileLabel] = useState("");
  const [saveConsent, setSaveConsent] = useState(false);
  const [loadedChartId, setLoadedChartId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [privacyNotice, setPrivacyNotice] = useState("");
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const calculate = trpc.bazi.calculate.useMutation();
  const guide = trpc.bazi.guide.useMutation();
  const privacyStatus = trpc.bazi.privacyStatus.useQuery(undefined, { enabled: isAuthenticated });
  const savedProfiles = trpc.bazi.mine.useQuery(undefined, { enabled: isAuthenticated });
  const savedShares = trpc.bazi.shares.useQuery(undefined, { enabled: isAuthenticated });
  const saveProfile = trpc.bazi.save.useMutation({ onSuccess: async (result) => { await utils.bazi.mine.invalidate(); setLoadedChartId(result.chart.id); setSaveConsent(false); setPrivacyNotice("已以加密方式保存本次 profile；出生資料不會列入分享快照。"); } });
  const loadProfile = trpc.bazi.load.useMutation({ onSuccess: (loaded) => {
    const latestChart = loaded.charts[0];
    if (!latestChart) { setPrivacyNotice("此 profile 尚無可載入的排盤結果。"); return; }
    const [loadedYear, loadedMonth, loadedDay] = loaded.sensitive.birthDate.split("-").map(Number);
    const [loadedHour, loadedMinute] = loaded.sensitive.birthTime.split(":").map(Number);
    setDate(loaded.sensitive.birthDate);
    setTime(loaded.sensitive.birthTime);
    setBirthPlace(loaded.sensitive.birthPlace ?? "");
    setTargetYear(latestChart.targetYear);
    setSect(latestChart.sect === 1 ? 1 : 2);
    const storedDaYun = latestChart.chartResult as { daYun?: { conventions?: { genderParameter?: "male" | "female"; calculationSect?: 1 | 2 } } };
    setDaYunGender(storedDaYun.daYun?.conventions?.genderParameter);
    setDaYunSect(storedDaYun.daYun?.conventions?.calculationSect);
    setConsent(true);
    setLoadedChartId(latestChart.id);
    calculate.mutate({ consent: true, year: loadedYear, month: loadedMonth, day: loadedDay, hour: loadedHour, minute: loadedMinute, sect: latestChart.sect === 1 ? 1 : 2, targetYear: latestChart.targetYear, ...(storedDaYun.daYun?.conventions?.genderParameter && storedDaYun.daYun.conventions.calculationSect ? { daYunGender: storedDaYun.daYun.conventions.genderParameter, daYunSect: storedDaYun.daYun.conventions.calculationSect } : {}) });
    setPrivacyNotice(`已載入「${loaded.profile.label}」至本次私密工作區；資料只在此登入工作階段使用。`);
  } });
  const deleteProfile = trpc.bazi.deleteProfile.useMutation({ onSuccess: async () => { await utils.bazi.mine.invalidate(); setLoadedChartId(null); setDeleteConfirmId(null); setPrivacyNotice("已永久刪除此 profile 及所有關聯排盤、流年解說與同意紀錄。"); } });
  const shareProfile = trpc.bazi.share.useMutation({ onSuccess: async () => { await utils.bazi.shares.invalidate(); } });
  const revokeShare = trpc.share.revoke.useMutation({ onSuccess: async () => { await utils.bazi.shares.invalidate(); setPrivacyNotice("已撤銷遮罩分享快照；原連結將不再可讀取。"); } });

  const submit = () => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    calculate.mutate({ consent: true, year, month, day, hour, minute, sect, targetYear, ...(daYunGender && daYunSect ? { daYunGender, daYunSect } : {}) });
  };

  const marginalia = calculate.data ? createBaziMarginalia(calculate.data) : [];
  const requestGuide = () => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    guide.mutate({ consent: true, year, month, day, hour, minute, sect, targetYear, ...(daYunGender && daYunSect ? { daYunGender, daYunSect } : {}), question: guideQuestion.trim() || undefined });
  };

  const saveCurrentProfile = () => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    saveProfile.mutate({ saveConsent: true, label: profileLabel.trim() || `排盤 ${date}`, year, month, day, hour, minute, sect, targetYear, ...(daYunGender && daYunSect ? { daYunGender, daYunSect } : {}), timezone: "Asia/Taipei", birthPlace: birthPlace.trim() || undefined, guideContent: guide.data?.content, guideKind: guide.data?.kind === "safety_redirect" ? "safety_redirect" : guide.data?.kind === "fallback" ? "fallback" : guide.data?.kind === "guide" ? "guide" : undefined });
  };

  const shareSavedChart = async (chartId: number) => {
    try {
      const share = await shareProfile.mutateAsync({ chartId, expiresInDays: 30 });
      const url = `${window.location.origin}/share/${share.token}`;
      if (navigator.share) await navigator.share({ title: "八字／流年結構研讀", text: "出生資料已遮罩的研究快照", url });
      else await navigator.clipboard.writeText(url);
      setPrivacyNotice("已建立 30 天可撤銷的遮罩分享連結；連結僅含盤面結構與研究解說。\n");
    } catch {
      setPrivacyNotice("目前無法建立分享連結，請稍後再試。\n");
    }
  };

  const clearSession = () => {
    calculate.reset();
    guide.reset();
    setGuideQuestion("");
    setConsent(false);
    setPrivacyNotice("本頁暫時排盤結果已清除；未保存資料不會寫入伺服器。\n");
  };

  return (
    <main className="min-h-screen bg-[#f8f5ed] px-5 py-24 text-[#1f2b22]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-xs tracking-[.24em] text-[#9a7131]">八字・流年｜私密反思工作區</p>
          <h1 className="mt-3 font-serif text-4xl">先看可檢查的盤，再讀傳統結構</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">生辰資料預設不保存。本 MVP 以民用時間、節氣月與您選擇的日界規則計算；不提供醫療、法律、投資或事件預測。</p>
        </header>

        <section className="grid gap-4 rounded-3xl border border-[#d7c9ac] bg-white/60 p-6 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">出生日期<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-medium">出生時間<Input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-medium">目標流年<Input type="number" value={targetYear} onChange={(event) => setTargetYear(Number(event.target.value))} /></label>
          <label className="md:col-span-3 grid gap-1.5 text-sm font-medium">出生地（選填；只有您另行同意保存時才會加密）<Input value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} maxLength={255} placeholder="例如：Taipei；本 MVP 不用於真太陽時校正" /></label>
          <label className="md:col-span-3 flex gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />我同意系統僅為本次私密反思計算生辰資料，不自動保存。</label>
          <div className="md:col-span-3 flex flex-wrap gap-3">
            <Button variant={sect === 2 ? "default" : "outline"} onClick={() => setSect(2)}>子正換日</Button>
            <Button variant={sect === 1 ? "default" : "outline"} onClick={() => setSect(1)}>子初換日</Button>
            <Button disabled={!consent || calculate.isPending} onClick={submit}>{calculate.isPending ? "正在排盤…" : "排出四柱與流年"}</Button>
            <Button variant="ghost" onClick={clearSession}>清除此頁結果</Button>
          </div>
          <div className="md:col-span-3 rounded-2xl border border-[#e1d6bc] bg-[#fffdf8] p-4">
            <p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">選用大運時間軸</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">大運採傳統順逆行參數計算；須同時明示選擇傳統規則參數與起運換算口徑，系統不會從帳號、姓名或其他資料推定。未完成兩項選擇時仍可排四柱與流年，但不顯示大運。</p>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={daYunGender === "male" ? "default" : "outline"} onClick={() => setDaYunGender("male")}>傳統規則：男</Button><Button size="sm" variant={daYunGender === "female" ? "default" : "outline"} onClick={() => setDaYunGender("female")}>傳統規則：女</Button><Button size="sm" variant={daYunSect === 2 ? "default" : "outline"} onClick={() => setDaYunSect(2)}>分鐘差起運</Button><Button size="sm" variant={daYunSect === 1 ? "default" : "outline"} onClick={() => setDaYunSect(1)}>時辰差起運</Button></div>
            <p className="mt-3 text-xs leading-5 text-stone-600">本頁仍以民用時間、節氣與您選擇的子初／子正日界計算；未套用真太陽時。不同傳統可能採用不同順逆行或起運口徑。</p>
          </div>
          {calculate.error && <p className="md:col-span-3 text-sm text-red-700">排盤暫時無法完成；請確認已登入、勾選同意，並檢查日期時間後重試。</p>}
        </section>

        {isAuthenticated && <section className="rounded-3xl border border-[#bca46f] bg-[#f3ead9]/55 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">私密保存庫</p><h2 className="mt-2 font-serif text-2xl">您主動保存的加密排盤</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">出生日期、時間、時區與出生地只在伺服器端加密保存。清單不顯示生辰內容；刪除 profile 時，關聯排盤、流年解說與同意紀錄會一併永久刪除。</p></div><LockKeyhole className="size-6 text-[#9a7131]" /></div>{privacyStatus.data && !privacyStatus.data.encryptionReady && <p className="mt-4 text-sm text-red-700">加密設定尚未就緒，暫時無法保存敏感資料。</p>}{savedProfiles.data?.length ? <div className="mt-5 grid gap-3">{savedProfiles.data.map((profile) => <article key={profile.id} className="flex flex-col gap-3 rounded-2xl border border-[#ded0ad] bg-white/80 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><h3 className="font-serif text-lg text-[#6e522a]">{profile.label}</h3><p className="mt-1 text-xs leading-5 text-stone-600">加密版本：{profile.encryptionVersion}；保存於 {new Date(profile.createdAt).toLocaleDateString("zh-TW")}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={loadProfile.isPending} onClick={() => loadProfile.mutate({ profileId: profile.id })}>{loadProfile.isPending ? "正在載入…" : "載入"}</Button><Button size="sm" variant="ghost" className="text-[#8e3e31]" disabled={deleteProfile.isPending} onClick={() => { if (deleteConfirmId !== profile.id) { setDeleteConfirmId(profile.id); setPrivacyNotice("請再次點選「確認永久刪除」以清除 profile 與所有關聯資料；此動作無法復原。"); return; } deleteProfile.mutate({ profileId: profile.id }); }}><Trash2 className="mr-1 size-3.5" />{deleteConfirmId === profile.id ? "確認永久刪除" : "永久刪除"}</Button></div></article>)}</div> : <p className="mt-5 text-sm leading-6 text-stone-600">尚未保存任何 profile；本次排盤仍維持暫時運算。</p>}{loadedChartId && <div className="mt-5 rounded-2xl border border-[#ded0ad] bg-white/80 p-4"><p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">已載入的私密排盤</p><p className="mt-2 text-sm text-stone-700">可建立只含結構資料的 30 天可撤銷分享快照；出生資料不會寫入分享內容。</p><Button size="sm" className="mt-3" disabled={shareProfile.isPending} onClick={() => shareSavedChart(loadedChartId)}>建立遮罩分享連結</Button></div>}{savedShares.data?.filter((share) => !share.isRevoked).length ? <div className="mt-5 rounded-2xl border border-[#ded0ad] bg-white/80 p-4"><p className="text-xs font-semibold tracking-[.16em] text-[#9a7131]">可撤銷的遮罩分享</p><div className="mt-3 grid gap-3">{savedShares.data.filter((share) => !share.isRevoked).map((share) => <div key={share.id} className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-stone-700">{share.title} · 至 {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString("zh-TW") : "未設定到期日"}</p><Button size="sm" variant="outline" className="border-[#9b4a3d] text-[#8e3e31]" disabled={revokeShare.isPending} onClick={() => revokeShare.mutate({ id: share.id })}>撤銷快照</Button></div>)}</div></div> : null}{privacyNotice && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#6e522a]">{privacyNotice}</p>}</section>}
        {!authLoading && !isAuthenticated && <section className="rounded-3xl border border-[#bca46f] bg-[#f3ead9]/55 p-5 sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">私密保存庫</p><h2 className="mt-2 font-serif text-2xl">登入後才可選擇加密保存</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">未登入時，排盤只保留於本頁工作階段。登入後，您可另行同意保存，並隨時永久刪除或建立遮罩分享快照。</p><Button variant="outline" className="mt-4 border-[#9a7131] text-[#6e522a]" onClick={() => startLogin()}><LockKeyhole className="mr-2 size-4" />登入以管理私密資料</Button></section>}

        {calculate.data && (
          <section className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              {calculate.data.pillars.map((pillar) => <article key={pillar.label} className="rounded-2xl bg-[#1f2b22] p-5 text-center text-white"><p className="text-xs text-[#d7bd8b]">{pillar.label}</p><p className="mt-2 text-3xl font-serif">{pillar.value}</p></article>)}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#d7c9ac] bg-white p-5"><h2 className="font-serif text-xl">計算依據</h2><dl className="mt-3 grid gap-2 text-sm leading-6 text-stone-700"><div><dt className="text-[#9a7131]">輸入</dt><dd>{date} {time}；目標流年 {targetYear}</dd></div><div><dt className="text-[#9a7131]">時區與時間</dt><dd>民用時間（Asia/Taipei）；未套用真太陽時校正。</dd></div><div><dt className="text-[#9a7131]">曆法與邊界</dt><dd>{calculate.data.conventions.calendar}；{calculate.data.conventions.dayBoundary}</dd></div><div><dt className="text-[#9a7131]">大運口徑</dt><dd>{calculate.data.daYun ? `${calculate.data.daYun.conventions.genderLabel}；${calculate.data.daYun.conventions.startMethod}` : calculate.data.conventions.daYunNotice}</dd></div><div><dt className="text-[#9a7131]">引擎</dt><dd>{calculate.data.conventions.engine}</dd></div></dl></article>
              <article className="rounded-2xl border border-[#d7c9ac] bg-white p-5"><h2 className="font-serif text-xl">{calculate.data.annual.year} 流年結構</h2><p className="mt-2 text-3xl font-serif">{calculate.data.annual.ganZhi}</p><p className="text-sm leading-6 text-stone-600">{calculate.data.annual.reference}</p></article>
            </div>
            {calculate.data.daYun && <section className="rounded-3xl border border-[#bca46f] bg-[#f3ead9]/55 p-5 sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">大運時間軸｜研究參照</p><h2 className="mt-2 font-serif text-2xl">先核對起運口徑，再讀十年柱位</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">本次為{calculate.data.daYun.direction}；起運偏移為 {calculate.data.daYun.start.offset.years} 年 {calculate.data.daYun.start.offset.months} 月 {calculate.data.daYun.start.offset.days} 日 {calculate.data.daYun.start.offset.hours} 時，起運日為 {calculate.data.daYun.start.solarDate}。</p><div className="mt-5 grid gap-3 md:grid-cols-2"><article className="rounded-2xl border border-dashed border-[#bfa775] bg-[#fffaf0] p-4"><div className="flex items-baseline justify-between gap-3"><h3 className="font-serif text-xl text-[#6e522a]">起運前區段</h3><p className="text-xs text-[#9a7131]">非十年柱</p></div><p className="mt-2 text-sm leading-6 text-stone-700">{calculate.data.daYun.preStart.startYear}–{calculate.data.daYun.preStart.endYear}；虛歲 {calculate.data.daYun.preStart.startAge}–{calculate.data.daYun.preStart.endAge}</p></article>{calculate.data.daYun.periods.map((period: { index: number; ganZhi?: string; startYear: number; endYear: number; startAge: number; endAge: number }) => <article key={period.index} className={`rounded-2xl border p-4 ${calculate.data.daYun?.currentPeriod?.index === period.index ? "border-[#9a7131] bg-[#fff8e9]" : "border-[#ded0ad] bg-white/80"}`}><div className="flex items-baseline justify-between gap-3"><h3 className="font-serif text-2xl text-[#6e522a]">{period.ganZhi}</h3><p className="text-xs text-[#9a7131]">第 {period.index} 步</p></div><p className="mt-2 text-sm leading-6 text-stone-700">{period.startYear}–{period.endYear}；虛歲 {period.startAge}–{period.endAge}</p>{calculate.data.daYun?.currentPeriod?.index === period.index && <p className="mt-2 text-xs font-medium text-[#8a6330]">目標流年 {targetYear} 位於此結構區段。</p>}</article>)}</div><p className="mt-5 rounded-xl border-l-2 border-[#c9b07e] pl-3 text-sm leading-6 text-stone-600">規則版本：{calculate.data.daYun.conventions.ruleVersion}。{calculate.data.daYun.conventions.pillarMethod} 此時間軸只供傳統結構研讀，不轉化為吉凶、事件或重大決策預測。</p></section>}
            {isAuthenticated && <section className="rounded-3xl border border-[#bca46f] bg-[#fffaf0] p-5 sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">選擇性私密保存</p><h2 className="mt-2 font-serif text-2xl">保存這次排盤，或維持不保存</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">預設不保存。只有勾選下列明示同意後，才會以 AES-256-GCM 加密保存出生資料；四柱與研究解說分開儲存，分享時出生資料一律遮罩。</p><label className="mt-5 grid gap-2 text-sm font-medium">Profile 名稱（不建議寫入完整出生資訊）<Input value={profileLabel} onChange={(event) => setProfileLabel(event.target.value)} maxLength={120} placeholder="例如：研究用 profile 1" /></label><label className="mt-4 flex gap-3 text-sm leading-6"><input type="checkbox" checked={saveConsent} onChange={(event) => setSaveConsent(event.target.checked)} />我同意系統依私密資料治理規格加密保存本次出生資料、盤面與研究解說，並了解可隨時永久刪除。</label><Button className="mt-4" disabled={!saveConsent || !privacyStatus.data?.encryptionReady || saveProfile.isPending} onClick={saveCurrentProfile}>{saveProfile.isPending ? "正在加密保存…" : "加密保存本次 profile"}</Button>{saveProfile.error && <p className="mt-3 text-sm text-red-700">保存失敗，請稍後再試；系統不會將未成功保存的資料列入 profile。</p>}</section>}
            <section className="rounded-3xl border border-[#d7c9ac] bg-[#fffdf8] p-5 sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">盤面眉批</p><h2 className="mt-2 font-serif text-2xl">以結構作旁註，而不作預測</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">各則眉批只整理本次四柱、十神、藏干、可見五行與流年計算慣例；請將其用作研讀與反思的線索，而非吉凶、事件或重大決策判斷。</p><div className="mt-5 grid gap-3 md:grid-cols-2">{marginalia.map((note) => <article key={note.title} className="rounded-2xl border border-[#e1d6bc] bg-white/80 p-4"><h3 className="font-serif text-lg text-[#6e522a]">{note.title}</h3><p className="mt-2 text-sm leading-6 text-[#334038]">{note.observation}</p><p className="mt-3 border-l-2 border-[#c9b07e] pl-3 text-sm leading-6 text-[#6c6356]">{note.reflection}</p></article>)}</div></section>
            <section className="rounded-3xl border border-[#bca46f] bg-[#203126] p-5 text-[#fffaf0] sm:p-7"><p className="text-xs font-semibold tracking-[.18em] text-[#e3c791]">AI 詳細研究解說</p><h2 className="mt-2 font-serif text-2xl">從確定性盤面出發，逐段閱讀</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#d8ddd4]">AI 只會取得本次已計算的四柱、藏干、十神、可見五行、流年與計算慣例，並依固定六段整理研究參照；不輸出吉凶、事件或重大決策預測。</p><label className="mt-5 grid gap-2 text-sm font-medium">想聚焦的研究問題（選填）<Textarea value={guideQuestion} onChange={(event) => setGuideQuestion(event.target.value)} className="border-[#708075] bg-[#f8f5ed] text-[#1f2b22]" placeholder="例如：請比較日主、月令、十神與流年的結構閱讀方式。" /></label><div className="mt-4 flex flex-wrap gap-3"><Button onClick={requestGuide} disabled={guide.isPending} className="bg-[#e3c791] text-[#1f2b22] hover:bg-[#f0d9a9]"><Sparkles className="mr-2 size-4" />{guide.isPending ? "正在整理研究解說…" : "生成 AI 研究解說"}</Button></div>{guide.error && <p className="mt-3 text-sm text-[#ffd2c9]">目前無法生成解說；請確認已登入後重試。系統仍保留既有盤面眉批作為研究參照。</p>}{guide.data && <div className="mt-6 grid gap-3 md:grid-cols-2">{guideSections(guide.data.content).map((section) => <article key={section.title} className="rounded-2xl border border-[#718075] bg-[#f8f5ed] p-4 text-[#1f2b22]"><h3 className="font-serif text-lg text-[#6e522a]">{section.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#334038]">{section.body}</p></article>)}</div>}</section>
          </section>
        )}

        <section className="rounded-3xl border border-[#bca46f] bg-[#f3ead9]/55 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.18em] text-[#9a7131]">研究參照模式</p><h2 className="mt-2 font-serif text-2xl">術語、慣例與觀察，和個人決策分開</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">此區不讀取、保存或使用您的出生資料；它是傳統術語、計算口徑與研究紀錄的工作紙，不產生個人吉凶、事件機率或決策建議。</p></div><Button variant="outline" className="border-[#9a7131] text-[#6e522a]" onClick={() => setResearchOpen((current) => !current)}>{researchOpen ? <ChevronUp className="mr-2 size-4" /> : <ChevronDown className="mr-2 size-4" />}{researchOpen ? "收合研究參照" : "開啟研究參照"}</Button></div>
          {researchOpen && <div className="mt-6 space-y-6"><div className="grid gap-3 md:grid-cols-2">{researchTerms.map(([term, explanation]) => <article key={term} className="rounded-2xl border border-[#ded0ad] bg-white/70 p-4"><BookOpenCheck className="size-4 text-[#9a7131]" /><h3 className="mt-2 font-serif text-lg">{term}</h3><p className="mt-2 text-sm leading-6 text-stone-700">{explanation}</p></article>)}</div><div className="rounded-2xl border border-[#ded0ad] bg-white/70 p-5"><div className="flex items-center gap-2"><Scale className="size-4 text-[#9a7131]" /><h3 className="font-serif text-xl">排盤慣例比較</h3></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm leading-6"><thead className="text-[#6e522a]"><tr><th className="pb-2 pr-4">項目</th><th className="pb-2 pr-4">子正／00:00</th><th className="pb-2">子初／23:00</th></tr></thead><tbody className="text-stone-700"><tr className="border-t border-[#e5d9bf]"><td className="py-2 pr-4 font-medium">換日界線</td><td className="py-2 pr-4">午夜 00:00</td><td className="py-2">前一日 23:00 起</td></tr><tr className="border-t border-[#e5d9bf]"><td className="py-2 pr-4 font-medium">可能影響</td><td className="py-2 pr-4">23:00–23:59 維持原民用日期</td><td className="py-2">23:00–23:59 可能轉入次日</td></tr><tr className="border-t border-[#e5d9bf]"><td className="py-2 pr-4 font-medium">共同前提</td><td className="py-2 pr-4" colSpan={2}>月柱皆採節氣月；本 MVP 均以輸入的民用時間計算，未校正真太陽時。</td></tr></tbody></table></div></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">本次觀察（僅暫存於目前頁面）<Textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="例如：比較兩種換日慣例後，哪些柱位改變？我還需要核對哪些資料？" /></label><label className="grid gap-2 text-sm font-medium">不確定性與待查證事項<Textarea value={uncertainty} onChange={(event) => setUncertainty(event.target.value)} placeholder="例如：出生時間來源、地點、時區或採用的術數傳統仍待核對。" /></label></div><div className="rounded-2xl border border-[#d7c9ac] bg-[#fffdf8] p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#9a7131]" /><div><h3 className="font-serif text-lg">描述統計資料尚未接入</h3><p className="mt-1 text-sm leading-6 text-stone-700">目前沒有具來源、可稽核且去識別化的實證資料集，因此本區不顯示比例、機率或預估。未來只有在資料來源、樣本定義、處理方法、限制與可重現性皆揭露後，才會提供描述性統計；即使如此，也不得推論為個人的吉凶、事件或重大決策依據。</p></div></div></div></div>}
        </section>
      </div>
    </main>
  );
}
