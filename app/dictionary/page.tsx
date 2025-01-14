"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DataField {
  name: string
  source: string
  description: string
  type: string
}

const dataFields: DataField[] = [
  { name: "date", source: "n/a", description: "Date in ISO 8601 format (YYYY-MM-DD).", type: "DATE" },
  { name: "twitter_post", source: "Twitter", description: "Number of posts containing the token cashtag on twitter.", type: "INTEGER" },
  { name: "twitter_user", source: "Twitter", description: "Number of unique users posting with the token cashtag.", type: "INTEGER" },
  { name: "twitter_retweet", source: "Twitter", description: "Number of retweets on posts containing the token cashtag.", type: "INTEGER" },
  { name: "twitter_like", source: "Twitter", description: "Number of likes on posts containing the token cashtag.", type: "INTEGER" },
  { name: "twitter_comment", source: "Twitter", description: "Number of comments on posts containing the token cashtag.", type: "INTEGER" },
  { name: "discord_message", source: "Discord", description: "Number of messages on the official project discord server.", type: "INTEGER" },
  { name: "discord_user", source: "Discord", description: "Number of unique users posting on the official project discord server.", type: "INTEGER" },
  { name: "telegram_message", source: "Telegram", description: "Number of messages on the official project telegram group.", type: "INTEGER" },
  { name: "telegram_user", source: "Telegram", description: "Number of unique users posting on the official project telegram group.", type: "INTEGER" },
  { name: "reddit_post", source: "Reddit", description: "Number of posts on the official project subreddit.", type: "INTEGER" },
  { name: "reddit_user", source: "Reddit", description: "Number of unique users posting on the official project subreddit.", type: "INTEGER" },
  { name: "reddit_up", source: "Reddit", description: "Number of ups on posts on the official project subreddit.", type: "INTEGER" },
  { name: "reddit_comment", source: "Reddit", description: "Number of comments on posts on the official project subreddit.", type: "INTEGER" },
  { name: "reddit_ratio", source: "Reddit", description: "Up ratio on posts on the official project subreddit.", type: "FLOAT" },
  { name: "reddit_subscriber", source: "Reddit", description: "Number of new subscribers on the official project subreddit.", type: "INTEGER" },
  { name: "github_commit", source: "GitHub", description: "Number of commits on the official github project.", type: "INTEGER" },
  { name: "github_developer", source: "GitHub", description: "Number of unique developers committing on the official github project.", type: "INTEGER" },
  { name: "github_repository", source: "GitHub", description: "Number of new github repositories on the official github project.", type: "INTEGER" },
  { name: "wikipedia_view", source: "Wikipedia", description: "Number of views on the official project wikipedia page.", type: "INTEGER" },
  { name: "forum_message", source: "Forum", description: "Number of messages on the official project forum.", type: "INTEGER" },
  { name: "forum_user", source: "Forum", description: "Number of unique users posting on the official project forum.", type: "INTEGER" },
  { name: "forum_topic", source: "Forum", description: "Number of new topics on the official project forum.", type: "INTEGER" },
  { name: "opening_price", source: "CoinMarketCap", description: "Opening price of the project token (USD).", type: "FLOAT" },
  { name: "trading_volume", source: "CoinMarketCap", description: "Trading volume of the project token (USD).", type: "INTEGER" },
  { name: "closing_price", source: "CoinMarketCap", description: "Closing price of the project token (USD).", type: "FLOAT" },
  { name: "return", source: "CoinMarketCap", description: "Return of the project token (%).", type: "FLOAT" }
]

export default function DictionaryPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Dictionary</CardTitle>
          <CardDescription>
            Explore our detailed Data Dictionary to gain a clear understanding of the data behind the projects you&apos;re analyzing. 
            This guide provides an in-depth look at each data field, its source, and its format, helping you navigate and make the most of the information available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Field Name</th>
                  <th scope="col" className="px-6 py-3 font-medium">Source</th>
                  <th scope="col" className="px-6 py-3 font-medium">Description</th>
                  <th scope="col" className="px-6 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {dataFields.map((field, index) => (
                  <tr key={field.name} className="border-b">
                    <td className="px-6 py-4 font-medium">{field.name}</td>
                    <td className="px-6 py-4">{field.source}</td>
                    <td className="px-6 py-4">{field.description}</td>
                    <td className="px-6 py-4">{field.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-sm text-muted-foreground text-center">
              Each field represents a key measure related to a project within the crypto ecosystem. 
              These data points are regularly updated and accessible via both our Dashboards and API. 
              If you have any questions regarding the meaning of specific fields, feel free to contact us.
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
