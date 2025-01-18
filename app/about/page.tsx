"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">About Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-lg leading-relaxed">
          <p>
            At Mopsos AI, we empower investors and companies with unparalleled insights into the dynamics of the crypto ecosystem. 
            By aggregating and analyzing data from multiple sources we provide both historical and real-time metrics to help you drive smarter decisions.
          </p>

          <div>
            <p className="mb-4">Mopsos AI is designed to address two critical needs:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Investment Analysis:</span> Empowering investors with exclusive data insights to gain a competitive edge in the market.
              </li>
              <li>
                <span className="font-medium">Community Monitoring:</span> Help crypto projects track and analyze their community&apos;s activity to foster growth and engagement.
              </li>
            </ul>
          </div>

          <p>
            With tailored data solutions and a commitment to accuracy, Mopsos AI is your partner in navigating the complex and fast-evolving crypto landscape.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}