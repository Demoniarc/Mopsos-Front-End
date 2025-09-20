"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, MenuIcon } from 'lucide-react'
import { useTheme } from "next-themes"
import { SearchBar } from "@/components/search-bar"
import { useWallet } from "@/hooks/useWallet"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const { address, connectWallet, disconnectWallet, error } = useWallet()

  const handleWalletClick = () => {
    if (address) {
      disconnectWallet()
    } else {
      connectWallet()
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="glass-effect dark:glass-effect-dark border-b border-white/20 backdrop-filter backdrop-blur-xl sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative">
                <img
                  src={theme === "dark" ? "/logo-light.svg" : "/logo-dark.svg"}
                  alt="Logo Mopsos AI"
                  className="h-10 w-10 md:h-12 md:w-12 transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Mopsos AI
              </span>
            </Link>
            <div className="hidden md:block">
              <SearchBar />
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dictionary" className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-300 hover:scale-105">
                Data Dictionary
              </Link>
              <Link href="/api" className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-300 hover:scale-105">
                API
              </Link>
              <Link href="/documentation" className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-300 hover:scale-105">
                Documentation
              </Link>
              <Link href="/about" className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-300 hover:scale-105">
                About Us
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
                <span className="sr-only">Switch theme</span>
              </Button>
              <Button 
                onClick={handleWalletClick}
                variant={address ? "outline" : "default"}
                className="font-semibold"
              >
                {address ? formatAddress(address) : "Connect Wallet"}
              </Button>
              {error && (
                <p className="text-sm text-red-300">{error}</p>
              )}
            </div>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="glass-effect dark:glass-effect-dark border-white/20">
                <div className="flex flex-col space-y-6 mt-8">
                  <SearchBar />
                  <Link href="/dictionary" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                    Data Dictionary
                  </Link>
                  <Link href="/api" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                    API
                  </Link>
                  <Link href="/documentation" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                    Documentation
                  </Link>
                  <Link href="/about" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                    About Us
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark")
                      setIsMenuOpen(false)
                    }}
                    className="justify-start"
                  >
                    {theme === "dark" ? (
                      <SunIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <MoonIcon className="h-5 w-5 mr-2" />
                    )}
                    Switch theme
                  </Button>
                  <Button 
                    onClick={() => {
                      handleWalletClick()
                      setIsMenuOpen(false)
                    }}
                    variant={address ? "outline" : "default"}
                  >
                    {address ? formatAddress(address) : "Connect Wallet"}
                  </Button>
                  {error && (
                    <p className="text-sm text-red-300">{error}</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
