"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { TrendingUp, TrendingDown, Search, Filter, Star } from "lucide-react"

interface Project {
  id: string
  name: string
  url: string
}

interface ProjectData {
  id: string
  twitter_user: number
  discord_user: number
  telegram_user: number
  closing_price?: number
  return?: number
  twitter_post?: number
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsData, setProjectsData] = useState<ProjectData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'name' | 'twitter' | 'discord' | 'telegram' | 'price'>('name')
  const [favorites, setFavorites] = useState<string[]>([])
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('project')
          .select('*')
          .neq('display', 'false')

        if (projectsError) throw projectsError
        if (projectsData) {
          setProjects(projectsData)
          setTotalProjects(projectsData.length)
        }

        const { data: totalPosts, error: totalPostsError } = await supabase
          .rpc('get_total_posts');

        if (totalPostsError) throw totalPostsError
        if (totalPosts) {
           setTotalPosts(totalPosts)
        }
        
        // Fetch latest metrics using a subquery approach
        const { data: metricsData, error: metricsError } = await supabase
          .from('data')
          .select(`
            id,
            twitter_user,
            discord_user,
            telegram_user,
            closing_price,
            return,
            twitter_post,
            date
          `)
          .order('date', { ascending: false })

        if (metricsError) throw metricsError
        
        if (metricsData) {
          // Group by id and get the latest entry for each project
          const latestDataMap = new Map<string, ProjectData>()
          
          metricsData.forEach((item: any) => {
            if (!latestDataMap.has(item.id)) {
              latestDataMap.set(item.id, {
                id: item.id,
                twitter_user: item.twitter_user || 0,
                discord_user: item.discord_user || 0,
                telegram_user: item.telegram_user || 0,
                closing_price: item.closing_price,
                return: item.return,
                twitter_post: item.twitter_post
              })
            }
          })
          
          const latestData = Array.from(latestDataMap.values())
          setProjectsData(latestData)
          
          // Calculate total users across all platforms
          const total = latestData.reduce((sum: number, project: ProjectData) => {
            return sum + (project.twitter_user || 0) + (project.discord_user || 0) + (project.telegram_user || 0)
          }, 0)
          setTotalUsers(total)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('mopsos-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  const getUserLabel = (count: number) => {
    return count === 0 || count === 1 ? 'user' : 'users'
  }

  const getProjectData = (projectId: string) => {
    return projectsData.find(data => data.id === projectId)
  }

  const toggleFavorite = (projectId: string) => {
    const newFavorites = favorites.includes(projectId)
      ? favorites.filter(id => id !== projectId)
      : [...favorites, projectId]
    
    setFavorites(newFavorites)
    localStorage.setItem('mopsos-favorites', JSON.stringify(newFavorites))
  }

  const getActivityLevel = (data: ProjectData | undefined) => {
    if (!data) return 'low'
    const totalActivity = (data.twitter_user || 0) + (data.discord_user || 0) + (data.telegram_user || 0)
    if (totalActivity > 1000) return 'high'
    if (totalActivity > 50) return 'medium'
    return 'low'
  }

  const getActivityBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="default\" className="bg-green-500">High Activity</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Activity</Badge>
      case 'low':
        return <Badge variant="outline">Low Activity</Badge>
      default:
        return null
    }
  }

  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dataA = getProjectData(a.id)
      const dataB = getProjectData(b.id)
      
      switch (sortBy) {
        case 'twitter':
          return (dataB?.twitter_user || 0) - (dataA?.twitter_user || 0)
        case 'discord':
          return (dataB?.discord_user || 0) - (dataA?.discord_user || 0)
        case 'telegram':
          return (dataB?.telegram_user || 0) - (dataA?.telegram_user || 0)
        case 'price':
          return (dataB?.closing_price || 0) - (dataA?.closing_price || 0)
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  // Separate favorites and regular projects
  const favoriteProjects = filteredAndSortedProjects.filter(project => favorites.includes(project.id))
  const regularProjects = filteredAndSortedProjects.filter(project => !favorites.includes(project.id))

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight pb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Crypto Social Analytics
        </h1>        
        {/* CTA Section */}
        <div className="mt-8 space-y-4">
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Want to understand and grow your crypto community? Get your project listed on Mopsos AI and start tracking engagement across Twitter, Discord, Telegram, and Reddit.
          </p>
          
          <div className="pt-2">
            <p className="text-base font-medium mb-4">
              👉 Click below to get listed.
            </p>
          </div>
          
          <div className="pt-2">
            <Link 
              href="https://forms.gle/phzyWDEfKT3QeYLL8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <button className="group relative px-8 py-4 text-lg font-bold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-purple-500">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:from-blue-500 group-hover:to-purple-500"></div>
                
                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                
                {/* Button Text */}
                <span className="relative z-10 flex items-center gap-2">
                  Get Listed
                  <svg 
                    className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                
                {/* Pulse Animation */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 animate-pulse"></div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalProjects}</div>
            <div className="text-sm text-muted-foreground">Projects Tracked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalPosts.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Curated Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm text-muted-foreground">Daily-updated Data</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">5+</div>
            <div className="text-sm text-muted-foreground">Social Platforms</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
          <Button
            variant={sortBy === 'twitter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('twitter')}
          >
            Twitter
          </Button>
          <Button
            variant={sortBy === 'discord' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('discord')}
          >
            Discord
          </Button>
          <Button
            variant={sortBy === 'telegram' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('telegram')}
          >
            Telegram
          </Button>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Your Favorites
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteProjects.map((project) => {
              const data = getProjectData(project.id)
              const activityLevel = getActivityLevel(data)
              
              return (
                <div key={project.id} className="relative">
                  <Link href={`/dashboard/${project.id}`}>
                    <Card className="hover:bg-accent transition-all duration-200 hover:shadow-lg border-2 border-yellow-200 dark:border-yellow-800">
                      <CardHeader className="flex flex-row items-center space-x-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={project.url}
                              alt={`${project.name} logo`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover scale-102"
                              sizes="48px"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="flex items-center justify-between">
                            {project.name}
                            {getActivityBadge(activityLevel)}
                          </CardTitle>
                          {data?.closing_price && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium">${data.closing_price.toFixed(4)}</span>
                              {data.return !== undefined && (
                                <div className={`flex items-center text-xs ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.return >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {data.return.toFixed(2)}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <dt className="font-medium">Twitter</dt>
                            <dd>{data?.twitter_user || 0} {getUserLabel(data?.twitter_user || 0)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium">Discord</dt>
                            <dd>{data?.discord_user || 0} {getUserLabel(data?.discord_user || 0)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium">Telegram</dt>
                            <dd>{data?.telegram_user || 0} {getUserLabel(data?.telegram_user || 0)}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(project.id)
                    }}
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {favoriteProjects.length > 0 ? 'All Projects' : 'Projects'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({filteredAndSortedProjects.length} {filteredAndSortedProjects.length === 1 ? 'project' : 'projects'})
          </span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {regularProjects.map((project) => {
            const data = getProjectData(project.id)
            const activityLevel = getActivityLevel(data)
            
            return (
              <div key={project.id} className="relative">
                <Link href={`/dashboard/${project.id}`}>
                  <Card className="hover:bg-accent transition-all duration-200 hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={project.url}
                            alt={`${project.name} logo`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover scale-102"
                            sizes="48px"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center justify-between">
                          {project.name}
                          {getActivityBadge(activityLevel)}
                        </CardTitle>
                        {data?.closing_price && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium">${data.closing_price.toFixed(4)}</span>
                            {data.return !== undefined && (
                              <div className={`flex items-center text-xs ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.return >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {data.return.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <dt className="font-medium">Twitter</dt>
                          <dd>{data?.twitter_user || 0} {getUserLabel(data?.twitter_user || 0)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium">Discord</dt>
                          <dd>{data?.discord_user || 0} {getUserLabel(data?.discord_user || 0)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium">Telegram</dt>
                          <dd>{data?.telegram_user || 0} {getUserLabel(data?.telegram_user || 0)}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault()
                    toggleFavorite(project.id)
                  }}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {filteredAndSortedProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found matching your search.</p>
        </div>
      )}
    </div>
  )
}
