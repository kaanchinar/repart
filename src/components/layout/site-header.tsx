"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, ShoppingBag, MessageCircle, UserRound, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Ana səhifə" },
  { href: "/listings", label: "Elanlar" },
  { href: "/orders", label: "Sifarişlər" },
  { href: "/messages", label: "Mesajlar" }
]

export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavClick = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#05070d]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
          <CircleDot className="h-4 w-4 text-slate-300" />
          RePart
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-white",
                pathname === link.href ? "text-white" : "text-slate-400"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sell"
            className="hidden items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 sm:inline-flex"
          >
            <ShoppingBag className="h-4 w-4" />
            Satış et
          </Link>
          <Link
            href="/profile"
            className="hidden rounded-full border border-slate-800 p-2 text-slate-200 transition hover:border-slate-600 md:inline-flex"
            aria-label="Profil"
          >
            <UserRound className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-800 p-2 text-slate-200 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Navigasiyanı aç"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-800 bg-[#05070d] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm text-slate-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className={cn(
                  "rounded-md px-3 py-2 transition hover:bg-slate-800/50",
                  pathname === link.href ? "bg-slate-800/70 text-white" : "text-slate-300"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/messages"
              onClick={handleNavClick}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800/50"
            >
              <MessageCircle className="h-4 w-4" />
              Dəstək
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
