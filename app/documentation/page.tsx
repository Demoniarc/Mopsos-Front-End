"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CodeBlockProps {
  language: string
  code: string
  className?: string
}

function CodeBlock({ language, code, className }: CodeBlockProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className={cn("relative rounded-lg bg-muted p-4", className)}>
      <div className="absolute right-4 top-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-6 w-6"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <pre className="overflow-x-auto">
        <code className="text-sm">{code}</code>
      </pre>
    </div>
  )
}

export default function DocumentationPage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">
          Welcome to the Mopsos AI API documentation. This page provides detailed information on how to use the endpoints of our API to retrieve data for your projects. The API is designed to give you access to key metrics about the projects you are analyzing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock
            language="arduino"
            code="https://api.mopsos.ai/"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>We currently provide two main endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* /project_id endpoint */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">1. /project_id</h3>
            <p><strong>Method:</strong> GET</p>
            <p>This endpoint returns the list of project IDs available in the Mopsos AI database. You can use these IDs to query specific project data from the /data endpoint.</p>
            
            <div className="space-y-2">
              <p className="font-medium">Request Parameters:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>api-key / x-api-key</strong> (query parameter or header): Your valid API key.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Example Request:</p>
              <CodeBlock
                language="arduino"
                code="GET https://api.mopsos.ai/project_id?api-key=your_api_key"
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium">Example Response:</p>
              <CodeBlock
                language="json"
                code={`["project_1", "project_2", "project_3"]`}
              />
            </div>
          </div>

          {/* /data endpoint */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">2. /data</h3>
            <p><strong>Method:</strong> GET</p>
            <p>This endpoint allows you to retrieve data for a specific project. You can filter the data by project ID, start date, and end date.</p>

            <div className="space-y-2">
              <p className="font-medium">Request Parameters:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>api-key / x-api-key</strong> (query parameter or header): Your valid API key.</li>
                <li><strong>project_id</strong> (required): The unique ID of the project.</li>
                <li><strong>start_date</strong> (optional): The start date in ISO 8601 format (YYYY-MM-DD).</li>
                <li><strong>end_date</strong> (optional): The end date in ISO 8601 format (YYYY-MM-DD).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Example Request:</p>
              <CodeBlock
                language="arduino"
                code="GET https://api.mopsos.ai/data?project_id=project_1&start_date=2024-01-01&end_date=2024-01-31&api-key=your_api_key"
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium">Example Response:</p>
              <CodeBlock
                language="json"
                code={`[
  {
    "date": "2024-01-01",
    "twitter_post": 120,
    "twitter_user": 100,
    "discord_message": 50,
    "telegram_message": 30,
    "wikipedia_view": 200,
    "opening_price": 10.5,
    "closing_price": 11.0
  },
  {
    "date": "2024-01-02",
    "twitter_post": 110,
    "twitter_user": 95,
    "discord_message": 60,
    "telegram_message": 25,
    "wikipedia_view": 180,
    "opening_price": 11.0,
    "closing_price": 10.8
  }
]`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To interact with the API, you must include a valid API key in either the query parameter api-key or the request header x-api-key. 
            You can obtain an API key by visiting our <Link href="/api">API page</Link>.
          </p>
          <p>
            If the provided API key is invalid or expired, the API will respond with an error message and a status code 401 (Unauthorized).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>Here&apos;s an example of how to make a request to the /data endpoint using Python</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            language="python"
            code={`import requests

url = "https://api.mopsos.ai/data"
headers = {
    "x-api-key": "your_api_key"
}
params = {
    "project_id": "project_1",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

print(data)`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support & Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            If you encounter any issues or need further assistance, feel free to contact our support team via email at{" "}
            <a href="mailto:support@mopsos.ai" className="text-primary hover:underline">
              ai.mopsos@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
