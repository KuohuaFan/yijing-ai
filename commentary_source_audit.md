# 首批《易》注本可導入來源查核

查核日期：2026-08-26

| 注本 | 可用候選來源 | 可取得格式／結構 | 導入判定 |
|---|---|---|---|
| 王弼《周易註》／韓康伯《易傳》注 | [國家圖書館臺灣華文電子書庫《周易十卷》](https://taiwanebook.ncl.edu.tw/zh-tw/book/NCL-9910007105/reader) | 網頁明示為中華書局 PDF 閱讀；書目載明王弼、韓康伯注及王弼《略例》、邢璹注、陸德明音義。 | 可作掃描校勘與章節結構核對；頁面未明示可批次下載、OCR 或再發布許可，暫列「僅校勘／需另行取得許可」。 |
| 程頤《周易程氏傳》（《伊川易傳》） | [維基文庫《伊川易傳》（四庫全書本）全覽](https://zh.wikisource.org/wiki/伊川易傳_(四庫全書本)/全覽)；[中國哲學書電子化計劃版本說明](https://ctext.org/wiki.pl?if=gb&res=472353) | 維基文庫全覽具有卷、上／下經、卦與爻文錨點，適合解析為「卦→卦辭→爻辭→彖／象／文言」；CText 顯示版本為六安塗氏求我齋所刊書本。 | 維基文庫文字受其網站條款／CC BY-SA 方式再利用限制，若導入完整文字須保留授權與署名／相同方式分享義務；CText 僅作結構與異文校勘參照，不直接擷取其編校文字。 |
| 朱熹《周易本義》 | [Internet Archive 卷一](https://archive.org/details/06081008.cn)；[Internet Archive 卷二至卷四](https://archive.org/details/06081009.cn) | Archive 頁面明示為《四庫全書薈要》影印古籍，卷一頁面列 OCR（Tesseract）、PDF、162 頁、600 PPI 與浙江大學掃描中心。 | 可作公開掃描與 OCR 校訂的候選底本；條目頁未在擷取內容中明示整體再發布許可，完整轉錄進生產資料庫前應向上傳機構核對其數位化條件。暫列「需權利覆核」。 |

## 建議的段落匯入對位鍵

```text
commentary_id: wangbi_hankangbo | chengyi | zhuxi
work_title: 周易註 | 伊川易傳 | 周易本義
hexagram_id: 1..64
section_type: guaci | line_1..line_6 | tuan | daxian | xiaoxiang | wenyan
anchor: hex-{id} | line-{id}-{n} | tuan-{id} | daxiang-{id}
source_url: 原始館藏或已獲授權文本連結
source_locator: 卷／頁／影像頁或原始錨點
rights_status: licensed | cc-by-sa | permission-required | collation-only
transcription_status: pending | ocr | proofread | published
```

> 在取得明示可重製底本之前，網站僅應顯示版本名稱、方法摘要與原始來源連結；不得把第三方平臺的編校全文直接複製至資料庫。
