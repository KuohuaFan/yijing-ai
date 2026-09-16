import { Link, useLocation } from "wouter";
import { BookOpenText, Compass, LogIn, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/", label: "問易" },
  { href: "/library", label: "讀本" },
  { href: "/library?tab=hexagrams", label: "六十四卦" },
  { href: "/library?tab=wings", label: "十翼" },
  { href: "/sources", label: "版本與來源" },
];

export function SiteHeader() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-[#24342c]/10 bg-[#f8f5ee]/88 backdrop-blur-xl">
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => <Link key={link.href} href={link.href} className={cn("text-sm transition-colors", location === link.href.split("?")[0] ? "font-semibold text-[#a66b28]" : "text-[#5d665e] hover:text-[#1f2a25]")}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" size="icon" aria-label="搜尋讀本" onClick={() => window.location.assign("/library")}><Search className="size-4" /></Button>
          <Link href="/shelf"><Button variant="ghost" size="icon" aria-label="個人書架"><BookOpenText className="size-4" /></Button></Link>
          {isAuthenticated ? <Button variant="outline" className="border-[#b99a70] text-[#51402e]" onClick={logout}>{user?.name ?? "我的書架"}</Button> : <Button className="bg-[#1f2a25] text-[#f8f5ee] hover:bg-[#31423a]" onClick={() => startLogin()}><LogIn className="mr-2 size-4" />登入保存</Button>}
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="開啟選單">{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <div className="border-t border-[#24342c]/10 bg-[#f8f5ee] px-5 py-5 lg:hidden"><nav className="grid gap-1">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-[#425148] hover:bg-[#ebe5d8]">{link.label}</Link>)}<Link href="/shelf" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm text-[#425148] hover:bg-[#ebe5d8]">個人書架</Link></nav><Button className="mt-4 w-full bg-[#1f2a25]" onClick={() => startLogin()}>{isAuthenticated ? "查看個人書架" : <><Sparkles className="mr-2 size-4" />登入以保存研讀</>}</Button></div>}
    </header>
  );
}
