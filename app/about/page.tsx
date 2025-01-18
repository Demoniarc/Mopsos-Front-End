"use client"

import { useTheme } from "next-themes"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  const { theme } = useTheme()

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">About Us</h1>
      
      <Card>
        <CardContent className="space-y-8">
          <p className="text-lg leading-relaxed pt-6">
            At Mopsos AI, we empower investors and companies with unparalleled insights into the dynamics of the crypto ecosystem. 
            By aggregating and analyzing data from multiple sources we provide both historical and real-time metrics to help you drive smarter decisions.
          </p>
          <p className="text-lg leading-relaxed pt-6">
          Mopsos AI is designed to address two critical needs:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <img
                src={theme === "dark" ? "/investment-icon-light.svg" : "/investment-icon-dark.svg"}
                alt="Investment Analysis Icon"
                className="h-11 w-11"
              />
              <div>
                <h2 className="text-xl font-semibold">Investment Analysis</h2>
                <p className="text-lg">
                  Empowering investors with exclusive data insights to gain a competitive edge in the market.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <img
                src={theme === "dark" ? "/community-icon-light.svg" : "/community-icon-dark.svg"}
                alt="Community Monitoring Icon"
                className="h-11 w-11"
              />
              <div>
                <h2 className="text-xl font-semibold">Community Monitoring</h2>
                <p className="text-lg">
                  Help crypto projects track and analyze their community&apos;s activity to foster growth and engagement.
                </p>
              </div>
            </div>
          </div>

          <p className="text-lg leading-relaxed">
            With tailored data solutions and a commitment to accuracy, Mopsos AI is your partner in navigating the complex and fast-evolving crypto landscape.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
