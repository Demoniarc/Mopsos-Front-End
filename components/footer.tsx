"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="glass-effect dark:glass-effect-dark border-t border-white/20 backdrop-filter backdrop-blur-xl mt-16">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="https://x.com/mopsos_ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:drop-shadow-lg"
            >
              <img
                src={theme === "dark" ? "/x-logo-light.svg" : "/x-logo-light.svg"}
                alt="Twitter"
                className="h-6 w-6 filter brightness-0 invert"
              />
            </Link>
            <Link 
              href="https://discord.gg/sAVWrTGHKT" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:drop-shadow-lg"
            >
              <img
                src={theme === "dark" ? "/discord-logo-light.svg" : "/discord-logo-light.svg"}
                alt="Discord"
                className="h-6 w-6 filter brightness-0 invert"
              />
            </Link>
            <Link 
              href="https://www.linkedin.com/company/mopsos-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110 hover:drop-shadow-lg"
            >
              <img
                src={theme === "dark" ? "/linkedin-logo-light.svg" : "/linkedin-logo-light.svg"}
                alt="LinkedIn"
                className="h-6 w-6 filter brightness-0 invert"
              />
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button asChild variant="secondary">
              <Link 
                href="https://forms.gle/phzyWDEfKT3QeYLL8" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Data Request
              </Link>
            </Button>
            <Button asChild>
              <Link 
                href="https://forms.gle/phzyWDEfKT3QeYLL8" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Contact Us
              </Link>
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-white/70 mt-8">
          © 2025 Mopsos AI — All Rights Reserved
        </div>
      </div>
    </footer>
  )
}
