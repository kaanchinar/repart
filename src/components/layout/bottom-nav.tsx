"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, User, MessageCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 z-50 pb-safe">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center transition-colors",
          isActive("/") ? "text-green-400" : "text-gray-400 hover:text-green-400"
        )}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Ana Səhifə</span>
      </Link>

      <Link
        href="/messages"
        className={cn(
          "flex flex-col items-center transition-colors",
          isActive("/messages") ? "text-green-400" : "text-gray-400 hover:text-green-400"
        )}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Mesajlar</span>
      </Link>

      <Link
        href="/sell"
        className={cn(
          "flex flex-col items-center transition-colors",
          isActive("/sell") ? "text-green-400" : "text-gray-400 hover:text-green-400"
        )}
      >
        <PlusCircle className="w-8 h-8 text-green-500" />
        <span className="text-[10px] mt-1 font-medium">Sat</span>
      </Link>

      <Link
        href="/orders"
        className={cn(
          "flex flex-col items-center transition-colors",
          isActive("/orders") ? "text-green-400" : "text-gray-400 hover:text-green-400"
        )}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Sifarişlər</span>
      </Link>

      <Link
        href="/profile"
        className={cn(
          "flex flex-col items-center transition-colors",
          isActive("/profile") ? "text-green-400" : "text-gray-400 hover:text-green-400"
        )}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-1 font-medium">Profil</span>
      </Link>
    </nav>
  )
}
