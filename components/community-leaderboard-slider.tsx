"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"

interface TwitterAuthor {
  author_id: string
  author: string
  avatar: string
  posts: number
  total_likes: number
  total_retweet: number
  total_comment: number
  total_quotes: number
}

interface DiscordAuthor {
  author_id: string
  author: string
  avatar: string
  total_message: number
}

interface TelegramAuthor {
  author_id: string
  author: string
  avatar: string
  total_message: number
}

interface GitHubAuthor {
  author_id: string
  author: string
  avatar: string
  total_commits: number
}

interface Platform {
  id: string
  name: string
  logo: string
  logoDark: string
  data: any[]
}

interface CommunityLeaderboardSliderProps {
  projectId: string
}

// Component for handling avatar images with instant fallback
const AvatarImage = ({ src, alt, platform, className }: { 
  src: string, 
  alt: string, 
  platform: 'twitter' | 'telegram' | 'discord' | 'github',
  className: string 
}) => {
  const [imageSrc, setImageSrc] = useState(() => {
    // Start with fallback image for twitter and telegram
    if (platform === 'twitter') return '/twitter_pfp.png'
    if (platform === 'telegram') return '/telegram_pfp.png'
    return src // For discord and github, use original src
  })
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false)

  useEffect(() => {
    // For twitter and telegram, try to load the original image after component mounts
    if ((platform === 'twitter' || platform === 'telegram') && !hasTriedOriginal && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
      }
      img.onerror = () => {
        // Keep the fallback image
      }
      img.src = src
      setHasTriedOriginal(true)
    }
  }, [src, platform, hasTriedOriginal])

  const handleError = () => {
    if (platform === 'twitter') {
      setImageSrc('/twitter_pfp.png')
    } else if (platform === 'telegram') {
      setImageSrc('/telegram_pfp.png')
    }
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  )
}

// Component for position badge with podium icons
const PositionBadge = ({ position }: { position: number }) => {
  const getPodiumIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return null
    }
  }

  const podiumIcon = getPodiumIcon(position)

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-bold">
      {podiumIcon || `#${position}`}
    </div>
  )
}

export function CommunityLeaderboardSlider({ projectId }: CommunityLeaderboardSliderProps) {
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  
  // Data states
  const [twitterAuthors, setTwitterAuthors] = useState<TwitterAuthor[]>([])
  const [discordAuthors, setDiscordAuthors] = useState<DiscordAuthor[]>([])
  const [telegramAuthors, setTelegramAuthors] = useState<TelegramAuthor[]>([])
  const [githubAuthors, setGithubAuthors] = useState<GitHubAuthor[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate date range (yesterday and 30 days before)
  const getDateRange = useCallback(() => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // Yesterday
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30) // 30 days before yesterday
    
    return {
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: endDate.toISOString().split('T')[0] // YYYY-MM-DD format
    }
  }, [])

  // Enhanced function to load individual platform data with timeout handling
  const loadPlatformData = useCallback(async (platform: string, rpcFunction: string, timeout = 20000) => {
    try {
      console.log(`Loading ${platform} leaderboard data...`)
      
      const { startDate, endDate } = getDateRange()
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${platform} leaderboard query timeout`)), timeout)
      })
      
      // Race between the query and timeout
      const queryPromise = supabase.rpc(rpcFunction, {
        project_id: projectId,
        start_date: startDate,
        end_date: endDate
      })
      
      const result = await Promise.race([queryPromise, timeoutPromise])
      
      const { data, error } = result as any
      
      if (error) {
        console.error(`${platform} leaderboard error:`, error)
        // Don't throw for timeout errors, just return empty array
        if (error.code === '57014' || error.message?.includes('timeout')) {
          console.warn(`${platform} leaderboard query timed out, skipping...`)
          return []
        }
        throw error
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn(`${platform} leaderboard returned invalid data:`, data)
        return []
      }
      
      console.log(`${platform} leaderboard loaded successfully: ${data.length} authors`)
      return data
    } catch (err: any) {
      console.error(`${platform} leaderboard exception:`, err)
      // For timeout errors, return empty array instead of failing
      if (err.message?.includes('timeout') || err.code === '57014') {
        console.warn(`${platform} leaderboard timed out, returning empty data`)
        return []
      }
      return []
    }
  }, [projectId, getDateRange])

  // Load all leaderboard data
  const loadLeaderboardData = useCallback(async () => {
    if (!projectId || loading) return
    
    console.log('Starting leaderboard data load...')
    setLoading(true)
    setError(null)
    
    try {
      // Reset all data first
      setTwitterAuthors([])
      setDiscordAuthors([])
      setTelegramAuthors([])
      setGithubAuthors([])

      // Load platforms in parallel with individual timeout handling
      const [twitterData, discordData, telegramData, githubData] = await Promise.allSettled([
        loadPlatformData('Twitter', 'get_top_twitter_authors'),
        loadPlatformData('Discord', 'get_top_discord_authors'),
        loadPlatformData('Telegram', 'get_top_telegram_authors'),
        loadPlatformData('GitHub', 'get_top_github_authors')
      ])
      
      // Process results, handling both successful and failed promises
      const processResult = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          console.warn('Platform leaderboard data load failed:', result.reason)
          return []
        }
      }
      
      const finalTwitterData = processResult(twitterData)
      const finalDiscordData = processResult(discordData)
      const finalTelegramData = processResult(telegramData)
      const finalGithubData = processResult(githubData)
      
      // Set all data at once
      console.log('Setting leaderboard data:', {
        twitter: finalTwitterData.length,
        discord: finalDiscordData.length,
        telegram: finalTelegramData.length,
        github: finalGithubData.length
      })
      
      setTwitterAuthors(finalTwitterData)
      setDiscordAuthors(finalDiscordData)
      setTelegramAuthors(finalTelegramData)
      setGithubAuthors(finalGithubData)
      
      setLoaded(true)
      console.log('Leaderboard data loading completed')
      
    } catch (error: any) {
      console.error("Critical error loading leaderboard data:", error)
      setError("Some leaderboard data could not be loaded due to server timeouts")
    } finally {
      setLoading(false)
    }
  }, [projectId, loading, loadPlatformData])

  // Load data on component mount
  useEffect(() => {
    if (projectId && !loaded && !loading) {
      loadLeaderboardData()
    }
  }, [projectId, loaded, loading, loadLeaderboardData])

  // Filter platforms that have data
  const allPlatforms: Platform[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      logo: '/x-logo-light.svg',
      logoDark: '/x-logo-dark.svg',
      data: twitterAuthors
    },
    {
      id: 'discord',
      name: 'Discord',
      logo: '/discord-logo-light.svg',
      logoDark: '/discord-logo-dark.svg',
      data: discordAuthors
    },
    {
      id: 'telegram',
      name: 'Telegram',
      logo: '/telegram-light.svg',
      logoDark: '/telegram-dark.svg',
      data: telegramAuthors
    },
    {
      id: 'github',
      name: 'GitHub',
      logo: '/github-light.svg',
      logoDark: '/github-dark.svg',
      data: githubAuthors
    }
  ]

  const availablePlatforms = allPlatforms.filter(platform => platform.data.length > 0)

  // If no platforms have data and not loading, don't render the component
  if (availablePlatforms.length === 0 && !loading) {
    return null
  }

  // Ensure currentSlide is within bounds
  useEffect(() => {
    if (currentSlide >= availablePlatforms.length && availablePlatforms.length > 0) {
      setCurrentSlide(0)
    }
  }, [availablePlatforms.length, currentSlide])

  const handlePlatformClick = (index: number) => {
    setCurrentSlide(index)
    setTranslateX(-index * 100)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const currentX = e.clientX
    const diff = currentX - startX
    const newTranslateX = -currentSlide * 100 + (diff / window.innerWidth) * 100
    setTranslateX(newTranslateX)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    setIsDragging(false)
    const currentX = e.clientX
    const diff = currentX - startX
    const threshold = 50 // minimum distance to trigger slide change
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide > 0) {
        // Slide right (previous)
        const newSlide = currentSlide - 1
        setCurrentSlide(newSlide)
        setTranslateX(-newSlide * 100)
      } else if (diff < 0 && currentSlide < availablePlatforms.length - 1) {
        // Slide left (next)
        const newSlide = currentSlide + 1
        setCurrentSlide(newSlide)
        setTranslateX(-newSlide * 100)
      } else {
        // Snap back to current slide
        setTranslateX(-currentSlide * 100)
      }
    } else {
      // Snap back to current slide
      setTranslateX(-currentSlide * 100)
    }
  }

  const renderTwitterContent = (authors: TwitterAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={`${author.author_id}-${index}`} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <PositionBadge position={index + 1} />
          <div className="flex-shrink-0">
            <AvatarImage
              src={author.avatar}
              alt={`${author.author}'s avatar`}
              platform="twitter"
              className="h-12 w-12 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
              <span className="text-sm text-muted-foreground truncate">{author.author_id}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Posts:</span>
                <span className="font-medium">{author.posts}</span>
              </div>
              <div className="flex items-center space-x-1">
                <img 
                  src={theme === "dark" ? "/like-light.svg" : "/like.svg"} 
                  alt="Likes" 
                  className="h-3 w-3" 
                />
                <span className="font-medium">{author.total_likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <img 
                  src={theme === "dark" ? "/retweet-light.svg" : "/retweet.svg"} 
                  alt="Retweets" 
                  className="h-3 w-3" 
                />
                <span className="font-medium">{author.total_retweet}</span>
              </div>
              <div className="flex items-center space-x-1">
                <img 
                  src={theme === "dark" ? "/comment-light.svg" : "/comment.svg"} 
                  alt="Comments" 
                  className="h-3 w-3" 
                />
                <span className="font-medium">{author.total_comment}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderDiscordContent = (authors: DiscordAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={`${author.author_id}-${index}`} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <PositionBadge position={index + 1} />
          <div className="flex-shrink-0">
            <AvatarImage
              src={`/discord_avatar/${author.avatar}`}
              alt={`${author.author}'s avatar`}
              platform="discord"
              className="h-12 w-12 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">{author.total_message}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderTelegramContent = (authors: TelegramAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={`${author.author_id}-${index}`} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <PositionBadge position={index + 1} />
          <div className="flex-shrink-0">
            <AvatarImage
              src={author.avatar}
              alt={`${author.author}'s avatar`}
              platform="telegram"
              className="h-12 w-12 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">{author.total_message}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGitHubContent = (authors: GitHubAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={`${author.author_id}-${index}`} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <PositionBadge position={index + 1} />
          <div className="flex-shrink-0">
            <AvatarImage
              src={author.avatar}
              alt={`${author.author}'s avatar`}
              platform="github"
              className="h-12 w-12 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Commits:</span>
                <span className="font-medium">{author.total_commits}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderContent = (platform: Platform) => {
    switch (platform.id) {
      case 'twitter':
        return renderTwitterContent(platform.data as TwitterAuthor[])
      case 'discord':
        return renderDiscordContent(platform.data as DiscordAuthor[])
      case 'telegram':
        return renderTelegramContent(platform.data as TelegramAuthor[])
      case 'github':
        return renderGitHubContent(platform.data as GitHubAuthor[])
      default:
        return null
    }
  }

  // Manual retry function
  const retryLeaderboardData = () => {
    setLoaded(false)
    setError(null)
    loadLeaderboardData()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading top community members...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top community members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={retryLeaderboardData} variant="outline">
              Retry Loading Leaderboard Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top community members</CardTitle>
          <div className="flex items-center space-x-2">
            {availablePlatforms.map((platform, index) => (
              <Button
                key={platform.id}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${index === currentSlide ? 'bg-accent' : ''}`}
                onClick={() => handlePlatformClick(index)}
              >
                <img
                  src={theme === "dark" ? platform.logo : platform.logoDark}
                  alt={platform.name}
                  className="h-5 w-5"
                />
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ 
              transform: `translateX(${translateX}%)`,
              width: `${availablePlatforms.length * 100}%`
            }}
          >
            {availablePlatforms.map((platform, index) => (
              <div key={platform.id} className="w-full flex-shrink-0 px-2">
                {renderContent(platform)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Dots indicator */}
        {availablePlatforms.length > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {availablePlatforms.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => handlePlatformClick(index)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
