export const BRAND = {
  name: "易經 AI",
  nameShort: "觀易",
  title: "易經 AI｜觀象・卜卦",
  tagline: "觀象・玩辭・觀變",
  logo: "/manus-storage/yijing-ai-logo_02eb33ab.png",
  configuredLogo: import.meta.env.VITE_APP_LOGO || null,
  canonicalUrl: "https://yijingai.manus.space",
  repositoryUrl: "https://github.com/KuohuaFan/yijing-ai",
} as const;

export function resolveBrandAssetUrl(path = BRAND.logo) {
  return new URL(path, BRAND.canonicalUrl).toString();
}
