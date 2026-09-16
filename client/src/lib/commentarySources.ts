export type CommentarySource = {
  id: "wangbi-hankangbo" | "chengyi" | "zhuxi";
  commentator: string;
  versionLabel: string;
  approach: string;
  sourceName: string;
  sourceUrl: string;
  importStatus: string;
};

export const firstCommentarySources: CommentarySource[] = [
  { id: "wangbi-hankangbo", commentator: "王弼／韓康伯", versionLabel: "《周易註》及《易傳》注", approach: "以卦主、義理與得意忘象的解讀脈絡為主軸。", sourceName: "維基文庫《周易註》（四庫全書本）", sourceUrl: "https://zh.wikisource.org/zh-hant/周易註_(四庫全書本)", importStatus: "已建立來源欄位；完整注文待可重製底本逐段校訂後導入。" },
  { id: "chengyi", commentator: "程頤", versionLabel: "《周易程氏傳》", approach: "以義理、時位與君子工夫形成對讀基線。", sourceName: "中國哲學書電子化計劃《周易傳義合訂》結構參照", sourceUrl: "https://ctext.org/wiki.pl?if=en&res=676949", importStatus: "僅作篇章結構核對；不直接重製平台編校文字。" },
  { id: "zhuxi", commentator: "朱熹", versionLabel: "《周易本義》", approach: "兼顧卦爻、占筮與義理，與程頤形成可比較的閱讀視角。", sourceName: "Internet Archive《周易本義》卷二至卷四掃描本", sourceUrl: "https://archive.org/details/06081009.cn", importStatus: "已置入掃描底本來源；完整注文待 OCR 校訂與權利覆核後導入。" },
];
