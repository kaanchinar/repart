"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, User, MessageCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-800 bg-[#060910] pb-safe shadow-[0_-6px_12px_rgba(0,0,0,0.25)] md:hidden">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isActive("/") ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Ana Səhifə</span>
      </Link>

      <Link
        href="/messages"
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isActive("/messages") ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Mesajlar</span>
      </Link>

      <Link
        href="/sell"
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isActive("/sell") ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        <PlusCircle className="h-8 w-8" />
        <span className="text-[10px] mt-1 font-medium">Sat</span>
      </Link>

      <Link
        href="/orders"
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isActive("/orders") ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Sifarişlər</span>
      </Link>

      <Link
        href="/profile"
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isActive("/profile") ? "text-white" : "text-slate-400 hover:text-white"
        )}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Profil</span>
      </Link>
    </nav>
  )
}
