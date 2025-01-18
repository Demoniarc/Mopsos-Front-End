"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">About Us</h1>
      
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">
            At Mopsos AI, we empower investors and companies with unparalleled insights into the dynamics of the crypto ecosystem. 
            By aggregating and analyzing data from multiple sources we provide both historical and real-time metrics to help you drive smarter decisions.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Investment Analysis</h2>
          <p className="text-lg">
            Empowering investors with exclusive data insights to gain a competitive edge in the market.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Community Monitoring</h2>
          <p className="text-lg">
            Help crypto projects track and analyze their community&apos;s activity to foster growth and engagement.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">
            With tailored data solutions and a commitment to accuracy, Mopsos AI is your partner in navigating the complex and fast-evolving crypto landscape.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
