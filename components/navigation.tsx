"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, Lock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-global-search"))
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.jpeg"
            alt="AD Club Logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="hidden font-semibold text-foreground sm:inline-block">
            AD Club
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={openSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="ml-2 gap-2 bg-transparent transition-all duration-200 hover:shadow-glow"
            >
              <Lock className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <nav className="border-t border-border/40 bg-background md:hidden">
          <div className="container mx-auto flex flex-col px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
              onClick={() => setIsOpen(false)}
            >
              <Lock className="h-4 w-4" />
              Admin Login
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
