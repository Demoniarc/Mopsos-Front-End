import { useState, useCallback, useEffect } from 'react'
import { POLYGON_CHAIN_CONFIG, POLYGON_CHAIN_ID } from '@/lib/constants'

declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      if (!window.ethereum) return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAddress(accounts[0])
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err)
    }
  }, [])

  const switchToPolygonNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_CHAIN_CONFIG],
          })
        } catch (addError) {
          throw new Error('Failed to add Polygon network')
        }
      } else {
        throw switchError
      }
    }
  }

  const connectWallet = useCallback(async () => {
    try {
      setError(null)
      
      if (!window.ethereum) {
        if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
          window.location.href = 'https://metamask.app.link/dapp/mopsos.ai/api'
          return
        }
        throw new Error('Please install MetaMask')
      }

      await switchToPolygonNetwork()
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      setAddress(accounts[0])
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAddress(null)
  }, [])

  useEffect(() => {
    checkIfWalletIsConnected()

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
        } else {
          setAddress(null)
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {})
        window.ethereum.removeListener('chainChanged', () => {})
      }
    }
  }, [checkIfWalletIsConnected])

  return {
    address,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!address
  }
}
