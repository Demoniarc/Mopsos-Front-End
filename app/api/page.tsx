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
  const [error, setError] = useState<string | null>(null)
  
  const { address, connectWallet } = useWallet()
  const { price, loading: contractLoading, error: contractError, payForAccess } = useApiContract()
  const { apiKey, loading: apiKeyLoading, error: apiKeyError, retryFetchApiKey } = useApiKey(address)

  const validateMonths = (value: string) => {
    const monthsNum = Number(value)
    return value !== "" && !isNaN(monthsNum) && monthsNum > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateMonths(months)) {
      setError("Please enter a valid number of months")
      return
    }
    
    setError(null)

    if (!address) {
      await connectWallet()
      return
    }

    setIsProcessing(true)
    try {
      const success = await payForAccess(Number(months))
      if (success) {
        await retryFetchApiKey(address)
      }
    } catch (err) {
      console.error("Error during payment:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setMonths(value)
    setError(null)
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
            href="https://api.mopsos.ai/docs"
            target="_blank" 
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
                type="text"
                inputMode="numeric"
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
              disabled={isProcessing || contractLoading || apiKeyLoading}
            >
              {!address 
                ? "Connect wallet" 
                : isProcessing 
                  ? "Transaction pending..." 
                  : "Pay and get your API key"}
            </Button>
            {(error || contractError || apiKeyError) && (
              <p className="text-sm text-destructive">{error || contractError || apiKeyError}</p>
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
