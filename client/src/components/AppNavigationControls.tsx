import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandMark";

export function AppNavigationControls() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  return <nav aria-label="頁面導覽" className="pointer-events-auto fixed left-16 top-4 z-[70] flex items-center gap-1 rounded-full border border-[#d9cfbd]/80 bg-[#fffdf8]/95 p-1 shadow-[0_8px_28px_rgba(31,42,37,.10)] backdrop-blur">
    <Button type="button" size="icon" variant="ghost" aria-label="返回上一頁" onClick={goBack} className="size-8 rounded-full text-[#425047] hover:bg-[#eee5d6]"><ArrowLeft className="size-4" /></Button>
    <a href="/" aria-label="返回首頁" className="grid size-8 place-items-center rounded-full hover:bg-[#eee5d6]"><BrandIcon className="size-6" /></a>
    <Button type="button" size="icon" variant="ghost" aria-label="前進下一頁" onClick={() => window.history.forward()} className="size-8 rounded-full text-[#425047] hover:bg-[#eee5d6]"><ArrowRight className="size-4" /></Button>
  </nav>;
}
