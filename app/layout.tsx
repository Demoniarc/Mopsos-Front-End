import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Head from "next/head"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mopsos AI",
  description: "Most advanced crypto social data.",
  icons: {
    icon: '/logo-dark.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/logo-dark.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(){
                if(!window.UnicornStudio){
                  window.UnicornStudio={isInitialized:!1};
                  var i=document.createElement("script");
                  i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.31/dist/unicornStudio.umd.js",
                  i.onload=function(){
                    window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
                  },
                  (document.head || document.body).appendChild(i)
                }
              }();
            `
          }}
        />
      </Head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
