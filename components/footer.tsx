"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <Link 
              href="https://x.com/mopsos_ai" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img
                src={theme === "dark" ? "/x-logo-light.svg" : "/x-logo-dark.svg"}
                alt="Twitter"
                className="h-6 w-6"
              />
            </Link>
            <Link 
              href="https://discord.gg/jHxTCBcg" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img
                src={theme === "dark" ? "/discord-logo-light.svg" : "/discord-logo-dark.svg"}
                alt="LinkedIn"
                className="h-6 w-6"
              />
            </Link>
            <Link 
              href="https://www.linkedin.com/company/mopsos-ai" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img
                src={theme === "dark" ? "/linkedin-logo-light.svg" : "/linkedin-logo-dark.svg"}
                alt="LinkedIn"
                className="h-6 w-6"
              />
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button asChild>
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
        <div className="text-center text-sm text-muted-foreground mt-6">
          © 2025 Mopsos AI — All Rights Reserved
        </div>
      </div>
    </footer>
  )
}
