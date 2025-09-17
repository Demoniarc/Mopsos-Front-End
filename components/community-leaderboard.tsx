"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { Trophy, Medal, Award } from "lucide-react"

interface LeaderboardMember {
  id: string
  author_id: string
  author: string
  avatar: string
  post: number
  like: number
  retweet: number
  comment: number
  quote: number
  rank: number
}

interface CommunityLeaderboardProps {
  projectId: string
}

// Component for handling avatar images with instant fallback (same as Twitter)
const AvatarImage = ({ src, alt, className }: { 
  src: string, 
  alt: string, 
  className: string 
}) => {
  const [imageSrc, setImageSrc] = useState('/twitter_pfp.png') // Start with fallback
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false)

  useEffect(() => {
    // Try to load the original image after component mounts
    if (!hasTriedOriginal && src) {
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
  }, [src, hasTriedOriginal])

  const handleError = () => {
    setImageSrc('/twitter_pfp.png')
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

// Component for rank icons
const RankIcon = ({ rank }: { rank: number }) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return (
        <div className="h-5 w-5 flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
        </div>
      )
  }
}

export function CommunityLeaderboard({ projectId }: CommunityLeaderboardProps) {
  const { theme } = useTheme()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: leaderboardError } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('id', projectId)
          .order('rank', { ascending: true })

        if (leaderboardError) {
          console.error('Leaderboard fetch error:', leaderboardError)
          throw new Error("Failed to load leaderboard data")
        }

        if (!data || data.length === 0) {
          setError("No leaderboard data available for this project")
          return
        }

        setLeaderboardData(data)
      } catch (err: any) {
        console.error("Error loading leaderboard:", err)
        setError("Failed to load community leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [projectId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top community members</CardTitle>
            <img
              src={theme === "dark" ? "/x-logo-light.svg" : "/x-logo-dark.svg"}
              alt="Twitter"
              className="h-5 w-5"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top community members</CardTitle>
            <img
              src={theme === "dark" ? "/x-logo-light.svg" : "/x-logo-dark.svg"}
              alt="Twitter"
              className="h-5 w-5"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (leaderboardData.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top community members</CardTitle>
          <img
            src={theme === "dark" ? "/x-logo-light.svg" : "/x-logo-dark.svg"}
            alt="Twitter"
            className="h-5 w-5"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboardData.map((member) => (
            <div key={`${member.author_id}-${member.rank}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              {/* Rank and Avatar */}
              <div className="flex items-center space-x-3">
                <RankIcon rank={member.rank} />
                <div className="flex-shrink-0">
                  <AvatarImage
                    src={member.avatar}
                    alt={`${member.author}'s avatar`}
                    className="h-10 w-10 rounded-full"
                  />
                </div>
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium truncate">{member.author}</span>
                  <span className="text-sm text-muted-foreground truncate">{member.author_id}</span>
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{member.post}</span>
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <img 
                      src={theme === "dark" ? "/like-light.svg" : "/like.svg"} 
                      alt="Likes" 
                      className="h-3 w-3" 
                    />
                    <span className="text-muted-foreground">{member.like}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <img 
                      src={theme === "dark" ? "/retweet-light.svg" : "/retweet.svg"} 
                      alt="Retweets" 
                      className="h-3 w-3" 
                    />
                    <span className="text-muted-foreground">{member.retweet}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <img 
                      src={theme === "dark" ? "/comment-light.svg" : "/comment.svg"} 
                      alt="Comments" 
                      className="h-3 w-3" 
                    />
                    <span className="text-muted-foreground">{member.comment}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <img 
                      src={theme === "dark" ? "/quote-light.svg" : "/quote.svg"} 
                      alt="Quotes" 
                      className="h-3 w-3" 
                    />
                    <span className="text-muted-foreground">{member.quote}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
