"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { Trophy, Medal, Award } from "lucide-react"

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

interface LeaderboardSliderProps {
  projectId: string
}

export function LeaderboardSlider({ projectId }: LeaderboardSliderProps) {
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data states for each platform
  const [twitterAuthors, setTwitterAuthors] = useState<TwitterAuthor[]>([])
  const [discordAuthors, setDiscordAuthors] = useState<DiscordAuthor[]>([])
  const [telegramAuthors, setTelegramAuthors] = useState<TelegramAuthor[]>([])
  const [githubAuthors, setGithubAuthors] = useState<GitHubAuthor[]>([])

  // Calculate date range (yesterday and 30 days before)
  const getDateRange = () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // Yesterday
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30) // 30 days before yesterday
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }
  }

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboardData = async () => {
      if (!projectId || loading) return
      
      setLoading(true)
      setError(null)
      
      try {
        const { start_date, end_date } = getDateRange()
        
        // Load all platforms in parallel
        const [twitterResult, discordResult, telegramResult, githubResult] = await Promise.allSettled([
          supabase.rpc('get_top_twitter_authors', {
            project_id: projectId,
            start_date,
            end_date
          }),
          supabase.rpc('get_top_discord_authors', {
            project_id: projectId,
            start_date,
            end_date
          }),
          supabase.rpc('get_top_telegram_authors', {
            project_id: projectId,
            start_date,
            end_date
          }),
          supabase.rpc('get_top_github_authors', {
            project_id: projectId,
            start_date,
            end_date
          })
        ])
        
        // Process Twitter results
        if (twitterResult.status === 'fulfilled' && !twitterResult.value.error) {
          setTwitterAuthors(twitterResult.value.data || [])
        } else {
          console.warn('Twitter leaderboard failed:', twitterResult)
          setTwitterAuthors([])
        }
        
        // Process Discord results
        if (discordResult.status === 'fulfilled' && !discordResult.value.error) {
          setDiscordAuthors(discordResult.value.data || [])
        } else {
          console.warn('Discord leaderboard failed:', discordResult)
          setDiscordAuthors([])
        }
        
        // Process Telegram results
        if (telegramResult.status === 'fulfilled' && !telegramResult.value.error) {
          setTelegramAuthors(telegramResult.value.data || [])
        } else {
          console.warn('Telegram leaderboard failed:', telegramResult)
          setTelegramAuthors([])
        }
        
        // Process GitHub results
        if (githubResult.status === 'fulfilled' && !githubResult.value.error) {
          setGithubAuthors(githubResult.value.data || [])
        } else {
          console.warn('GitHub leaderboard failed:', githubResult)
          setGithubAuthors([])
        }
        
      } catch (error) {
        console.error("Error loading leaderboard data:", error)
        setError("Failed to load leaderboard data")
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboardData()
  }, [projectId])

  // Define platforms with their data
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

  // Ensure currentSlide is within bounds
  useEffect(() => {
    if (currentSlide >= availablePlatforms.length && availablePlatforms.length > 0) {
      setCurrentSlide(0)
    }
  }, [availablePlatforms.length, currentSlide])

  // Get position icon
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return (
          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {position}
          </div>
        )
    }
  }

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
    const threshold = 50
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide > 0) {
        const newSlide = currentSlide - 1
        setCurrentSlide(newSlide)
        setTranslateX(-newSlide * 100)
      } else if (diff < 0 && currentSlide < availablePlatforms.length - 1) {
        const newSlide = currentSlide + 1
        setCurrentSlide(newSlide)
        setTranslateX(-newSlide * 100)
      } else {
        setTranslateX(-currentSlide * 100)
      }
    } else {
      setTranslateX(-currentSlide * 100)
    }
  }

  const renderTwitterLeaderboard = (authors: TwitterAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={author.author_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3">
            {getPositionIcon(index + 1)}
            <div className="flex-shrink-0">
              <img
                src={author.avatar}
                alt={`${author.author}'s avatar`}
                className="h-10 w-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
              <span className="text-sm text-muted-foreground truncate">{author.author_id}</span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
              <span>{author.posts} posts</span>
              <span>{author.total_likes} likes</span>
              <span>{author.total_retweet} retweets</span>
              <span>{author.total_comment} comments</span>
              <span>{author.total_quotes} quotes</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderDiscordLeaderboard = (authors: DiscordAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={author.author_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3">
            {getPositionIcon(index + 1)}
            <div className="flex-shrink-0">
              <img
                src={`/discord_avatar/${author.avatar}`}
                alt={`${author.author}'s avatar`}
                className="h-10 w-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {author.total_message} messages
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderTelegramLeaderboard = (authors: TelegramAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={author.author_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3">
            {getPositionIcon(index + 1)}
            <div className="flex-shrink-0">
              <img
                src={author.avatar}
                alt={`${author.author}'s avatar`}
                className="h-10 w-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {author.total_message} messages
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGitHubLeaderboard = (authors: GitHubAuthor[]) => (
    <div className="space-y-4">
      {authors.map((author, index) => (
        <div key={author.author_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3">
            {getPositionIcon(index + 1)}
            <div className="flex-shrink-0">
              <img
                src={author.avatar}
                alt={`${author.author}'s avatar`}
                className="h-10 w-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium truncate">{author.author}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {author.total_commits} commits
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderContent = (platform: Platform) => {
    switch (platform.id) {
      case 'twitter':
        return renderTwitterLeaderboard(platform.data as TwitterAuthor[])
      case 'discord':
        return renderDiscordLeaderboard(platform.data as DiscordAuthor[])
      case 'telegram':
        return renderTelegramLeaderboard(platform.data as TelegramAuthor[])
      case 'github':
        return renderGitHubLeaderboard(platform.data as GitHubAuthor[])
      default:
        return null
    }
  }

  // Don't render if no data available
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top community members</CardTitle>
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
          <div className="text-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availablePlatforms.length === 0) {
    return null
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
