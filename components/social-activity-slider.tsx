"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { format } from "date-fns"

interface DiscordMessage {
  date: string
  author: string
  avatar: string
  content: string
}

interface TwitterMessage {
  date: string
  author: string
  author_id: string
  avatar: string
  content: string
  like: number
  retweet: number
  quote: number
  comment: number
}

interface TelegramMessage {
  date: string
  author: string
  username: string
  content: string
  avatar: string
}

interface GitHubCommit {
  date: string
  author: string
  content: string
  comment: number
  avatar: string
}

interface Platform {
  id: string
  name: string
  logo: string
  logoDark: string
  data: any[]
}

interface SocialActivitySliderProps {
  discordMessages: DiscordMessage[]
  twitterMessages: TwitterMessage[]
  telegramMessages: TelegramMessage[]
  githubCommits: GitHubCommit[]
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
export function SocialActivitySlider({
  discordMessages,
  twitterMessages,
  telegramMessages,
  githubCommits
}: SocialActivitySliderProps) {
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)

  // Filter platforms that have data
  const allPlatforms: Platform[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      logo: '/x-logo-light.svg',
      logoDark: '/x-logo-dark.svg',
      data: twitterMessages
    },
    {
      id: 'discord',
      name: 'Discord',
      logo: '/discord-logo-light.svg',
      logoDark: '/discord-logo-dark.svg',
      data: discordMessages
    },
    {
      id: 'telegram',
      name: 'Telegram',
      logo: '/telegram-light.svg',
      logoDark: '/telegram-dark.svg',
      data: telegramMessages
    },
    {
      id: 'github',
      name: 'GitHub',
      logo: '/github-light.svg',
      logoDark: '/github-dark.svg',
      data: githubCommits
    }
  ]

  const availablePlatforms = allPlatforms.filter(platform => platform.data.length > 0)

  // If no platforms have data, don't render the component
  if (availablePlatforms.length === 0) {
    return null
  }

  // Ensure currentSlide is within bounds
  useEffect(() => {
    if (currentSlide >= availablePlatforms.length) {
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

  const renderTwitterContent = (messages: TwitterMessage[]) => (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex-shrink-0">
            <AvatarImage
              src={message.avatar}
              alt={`${message.author}'s avatar`}
              platform="twitter"
              className="h-10 w-10 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{message.author}</span>
              <span className="text-sm text-muted-foreground">{message.author_id}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(message.date), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm break-words">{message.content}</p>
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <img 
                  src={theme === "dark" ? "/comment-light.svg" : "/comment.svg"} 
                  alt="Comments" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-muted-foreground">{message.comment}</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src={theme === "dark" ? "/retweet-light.svg" : "/retweet.svg"} 
                  alt="Retweets" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-muted-foreground">{message.retweet}</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src={theme === "dark" ? "/quote-light.svg" : "/quote.svg"} 
                  alt="Quotes" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-muted-foreground">{message.quote}</span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src={theme === "dark" ? "/like-light.svg" : "/like.svg"} 
                  alt="Likes" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-muted-foreground">{message.like}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderDiscordContent = (messages: DiscordMessage[]) => (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex-shrink-0">
            <AvatarImage
              src={`/discord_avatar/${message.avatar}`}
              alt={`${message.author}'s avatar`}
              platform="discord"
              className="h-10 w-10 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{message.author}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(message.date), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm break-words">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderTelegramContent = (messages: TelegramMessage[]) => (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex-shrink-0">
            <AvatarImage
              src={message.avatar}
              alt={`${message.author}'s avatar`}
              platform="telegram"
              className="h-10 w-10 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{message.author}</span>
              <span className="text-sm text-muted-foreground">{message.username}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(message.date), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm break-words">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGitHubContent = (commits: GitHubCommit[]) => (
    <div className="space-y-6">
      {commits.map((commit, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex-shrink-0">
            <AvatarImage
              src={commit.avatar}
              alt={`${commit.author}'s avatar`}
              platform="github"
              className="h-10 w-10 rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{commit.author}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(commit.date), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm break-words">{commit.content}</p>
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <img 
                  src={theme === "dark" ? "/comment-light.svg" : "/comment.svg"} 
                  alt="Comments" 
                  className="h-4 w-4" 
                />
                <span className="text-sm text-muted-foreground">{commit.comment}</span>
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
        return renderTwitterContent(platform.data as TwitterMessage[])
      case 'discord':
        return renderDiscordContent(platform.data as DiscordMessage[])
      case 'telegram':
        return renderTelegramContent(platform.data as TelegramMessage[])
      case 'github':
        return renderGitHubContent(platform.data as GitHubCommit[])
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Latest {availablePlatforms[currentSlide]?.name} activity</CardTitle>
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
