"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/useWallet"
import { useApiContract } from "@/hooks/useApiContract"
import { useApiKey } from "@/hooks/useApiKey"

export default function ApiPage() {
  const [months, setMonths] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { address, connectWallet } = useWallet()
  const { price, loading: contractLoading, error: contractError, payForAccess } = useApiContract()
  const { apiKey, loading: apiKeyLoading, error: apiKeyError, retryFetchApiKey } = useApiKey(address)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      await connectWallet()
      return
    }

    setIsProcessing(true)
    try {
      const success = await payForAccess(Number(months))
      if (success) {
        // After successful payment, retry fetching the API key multiple times
        await retryFetchApiKey(address)
      }
    } catch (err) {
      console.error("Error during payment:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setMonths(value)
    }
  }

  const totalPrice = contractLoading ? '...' : (Number(price) * Number(months || 0)).toFixed(2)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mopsos AI API</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Access our comprehensive documentation for integrating the Mopsos AI API.</CardDescription>
        </CardHeader>
        <CardFooter>
          <a 
            href="https://mopsos.ai/documentation"
            rel="noopener noreferrer"
          >
            <Button>See the documentation</Button>
          </a>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Subscription</CardTitle>
          <CardDescription>Choose the duration of your subscription and get your API key.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="months">Number of subscription months</Label>
              <Input
                id="months"
                type="number"
                min="1"
                placeholder="Enter number of months"
                value={months}
                onChange={handleMonthsChange}
                required
              />
              {months && !contractLoading && (
                <p className="text-sm text-muted-foreground">
                  Total price: {totalPrice} MATIC
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={address ? (!months || isProcessing || contractLoading || apiKeyLoading) : false}
            >
              {!address 
                ? "Connect wallet" 
                : isProcessing 
                  ? "Transaction pending..." 
                  : "Pay and get your API key"}
            </Button>
            {(contractError || apiKeyError) && (
              <p className="text-sm text-destructive">{contractError || apiKeyError}</p>
            )}
          </form>
        </CardContent>
        {address && apiKey && (
          <CardFooter>
            <div className="w-full">
              <h3 className="font-semibold mb-2">Your API key:</h3>
              <code className="bg-secondary p-2 rounded block w-full break-all">{apiKey}</code>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
