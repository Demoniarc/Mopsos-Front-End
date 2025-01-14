import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

export function useApiKey(address: string | null) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApiKey = async (walletAddress: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}?address=${walletAddress}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY
        }
      })

      if (!response.ok) {
        throw new Error('')
      }

      const data = await response.json()
      if (data.api_key) {
        setApiKey(data.api_key)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API key')
      setApiKey(null)
    } finally {
      setLoading(false)
    }
  }

  const retryFetchApiKey = async (walletAddress: string, maxAttempts = 15, delay = 10000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delay))
      
      try {
        await fetchApiKey(walletAddress)
        if (apiKey) {
          return // Success, exit retry loop
        }
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          setError('Failed to retrieve API key after multiple attempts')
        }
      }
    }
  }

  useEffect(() => {
    if (address) {
      fetchApiKey(address)
    } else {
      setApiKey(null)
      setError(null)
    }
  }, [address])

  return {
    apiKey,
    loading,
    error,
    retryFetchApiKey
  }
}
