import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandIcon({ className }: { className?: string }) {
  return (
    <img
      src={BRAND.logo}
      alt="易經 AI 紫色白鳥 Logo"
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <BrandIcon className={compact ? "size-8" : "size-10"} />
      <span>
        <strong className="block font-serif text-lg font-semibold tracking-[0.12em] text-[#1f2a25]">{BRAND.nameShort}</strong>
        {!compact && <small className="block text-[9px] font-medium tracking-[0.16em] text-[#8e7656]">{BRAND.tagline}</small>}
      </span>
    </span>
  );
}
