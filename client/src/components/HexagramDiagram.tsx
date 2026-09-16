import { cn } from "@/lib/utils";

type Props = {
  pattern: string;
  movingLines?: number[];
  name?: string;
  number?: number;
  compact?: boolean;
  className?: string;
};

export function HexagramDiagram({ pattern, movingLines = [], name, number, compact = false, className }: Props) {
  const indices = [5, 4, 3, 2, 1, 0];
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)} aria-label={name ? `${name}卦象` : "卦象"}>
      <div className={cn("flex flex-col gap-1.5", compact && "gap-1")}> 
        {indices.map((index) => {
          const isYang = pattern[index] === "1";
          const isMoving = movingLines.includes(index + 1);
          return (
            <div key={index} className={cn("relative flex items-center justify-center", compact ? "h-1.5 w-10" : "h-2.5 w-24")}>
              <span className={cn("absolute rounded-full bg-current", isMoving ? "text-[#ad6f28]" : "text-[#1f2a25]", compact ? "h-1.5" : "h-2.5", isYang ? "inset-x-0" : "left-0 right-[54%]")} />
              {!isYang && <span className={cn("absolute right-0 rounded-full bg-current", isMoving ? "text-[#ad6f28]" : "text-[#1f2a25]", compact ? "h-1.5 w-[42%]" : "h-2.5 w-[42%]")} />}
              {isMoving && !compact && <span className="absolute -right-6 text-[10px] font-semibold text-[#ad6f28]">動</span>}
            </div>
          );
        })}
      </div>
      {!compact && (name || number) && <div className="text-center"><p className="font-serif text-lg text-[#1f2a25]">{name}</p><p className="text-[10px] tracking-[0.18em] text-[#7c827b]">{number ? `第 ${number} 卦` : "六爻"}</p></div>}
    </div>
  );
}
