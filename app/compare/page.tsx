"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ProjectSelector } from "@/components/project-selector"
import { MetricSelector } from "@/components/metric-selector"
import { TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react"

interface Project {
  id: string
  name: string
  url: string
}

interface DataPoint {
  date: string
  [key: string]: any
}

interface ComparisonData {
  date: string
  project1Value: number | null
  project2Value: number | null
  [key: string]: any
}

interface MetricInfo {
  key: string
  name: string
  available: boolean
}

interface ComparisonStats {
  project1: {
    latest: number | null
    change: number | null
    changePercent: number | null
  }
  project2: {
    latest: number | null
    change: number | null
    changePercent: number | null
  }
  correlation: number | null
}

// Helper function to format large numbers
const formatNumber = (value: number | null) => {
  if (value === null) return 'N/A'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toLocaleString()
}

// Helper function to format percentage
const formatPercent = (value: number | null) => {
  if (value === null) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Helper function to calculate correlation
// Helper function to calculate correlation
const calculateCorrelation = (data: ComparisonData[]): number | null => {
  const validPairs = data.filter(d => d.project1Value !== null && d.project2Value !== null)
  if (validPairs.length < 2) return null

  const n = validPairs.length
  const x = validPairs.map(d => d.project1Value!)
  const y = validPairs.map(d => d.project2Value!)

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? null : numerator / denominator
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject1, setSelectedProject1] = useState<Project | null>(null)
  const [selectedProject2, setSelectedProject2] = useState<Project | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>("")
  const [availableMetrics, setAvailableMetrics] = useState<MetricInfo[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [comparisonStats, setComparisonStats] = useState<ComparisonStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState("all")

  const timeRanges = [
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1y", days: 365 },
    { label: "All", days: null },
  ]

  // Load projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('project')
          .select('*')
          .neq('display', 'false')
          .order('name')

        if (error) throw error
        if (data) {
          setProjects(data)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      }
    }

    fetchProjects()
  }, [])

  // Load available metrics when both projects are selected
  useEffect(() => {
    const loadAvailableMetrics = async () => {
      if (!selectedProject1 || !selectedProject2) {
        setAvailableMetrics([])
        return
      }

      try {
        setLoading(true)
        
        // Fetch data for both projects
        const [{ data: data1 }, { data: data2 }] = await Promise.all([
          supabase
            .from('data')
            .select('*')
            .eq('id', selectedProject1.id)
            .order('date', { ascending: true }),
          supabase
            .from('data')
            .select('*')
            .eq('id', selectedProject2.id)
            .order('date', { ascending: true })
        ])

        if (!data1 || !data2) {
          setError('Failed to load project data')
          return
        }

        // Find common metrics (metrics that exist in both projects)
        const metrics1 = new Set<string>()
        const metrics2 = new Set<string>()

        data1.forEach(row => {
          Object.entries(row).forEach(([key, value]) => {
            if (value !== null && key !== 'id' && key !== 'date') {
              metrics1.add(key)
            }
          })
        })

        data2.forEach(row => {
          Object.entries(row).forEach(([key, value]) => {
            if (value !== null && key !== 'id' && key !== 'date') {
              metrics2.add(key)
            }
          })
        })

        // Create metrics info array
        const allMetrics = new Set([...metrics1, ...metrics2])
        const metricsInfo: MetricInfo[] = Array.from(allMetrics).map(key => ({
          key,
          name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          available: metrics1.has(key) && metrics2.has(key)
        })).sort((a, b) => {
          // Sort by availability first, then by name
          if (a.available && !b.available) return -1
          if (!a.available && b.available) return 1
          return a.name.localeCompare(b.name)
        })

        setAvailableMetrics(metricsInfo)
        
        // Auto-select first available metric
        const firstAvailable = metricsInfo.find(m => m.available)
        if (firstAvailable && !selectedMetric) {
          setSelectedMetric(firstAvailable.key)
        }

      } catch (err) {
        console.error('Error loading metrics:', err)
        setError('Failed to load available metrics')
      } finally {
        setLoading(false)
      }
    }

    loadAvailableMetrics()
  }, [selectedProject1, selectedProject2])

  // Load comparison data when projects and metric are selected
  useEffect(() => {
    const loadComparisonData = async () => {
      if (!selectedProject1 || !selectedProject2 || !selectedMetric) {
        setComparisonData([])
        setComparisonStats(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch data for both projects
        const [{ data: data1 }, { data: data2 }] = await Promise.all([
          supabase
            .from('data')
            .select(`date, ${selectedMetric}`)
            .eq('id', selectedProject1.id)
            .order('date', { ascending: true }),
          supabase
            .from('data')
            .select(`date, ${selectedMetric}`)
            .eq('id', selectedProject2.id)
            .order('date', { ascending: true })
        ])

        if (!data1 || !data2) {
          setError('Failed to load comparison data')
          return
        }

        // Create a map for easier lookup
        const data1Map = new Map(data1.map(row => [row.date, row[selectedMetric]]))
        const data2Map = new Map(data2.map(row => [row.date, row[selectedMetric]]))

        // Find common dates
        const allDates = new Set([...data1.map(row => row.date), ...data2.map(row => row.date)])
        const commonDates = Array.from(allDates)
          .filter(date => data1Map.has(date) && data2Map.has(date))
          .sort()

        // Apply time range filter
        let filteredDates = commonDates
        const range = timeRanges.find(r => r.label.toLowerCase() === selectedRange)
        if (range?.days) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - range.days)
          filteredDates = commonDates.filter(date => new Date(date) >= cutoffDate)
        }

        // Create comparison data
        const comparison: ComparisonData[] = filteredDates.map(date => ({
          date,
          project1Value: data1Map.get(date) || null,
          project2Value: data2Map.get(date) || null,
        }))

        setComparisonData(comparison)

        // Calculate statistics
        if (comparison.length > 0) {
          const validData1 = comparison.filter(d => d.project1Value !== null)
          const validData2 = comparison.filter(d => d.project2Value !== null)

          const stats: ComparisonStats = {
            project1: {
              latest: validData1.length > 0 ? validData1[validData1.length - 1].project1Value : null,
              change: null,
              changePercent: null
            },
            project2: {
              latest: validData2.length > 0 ? validData2[validData2.length - 1].project2Value : null,
              change: null,
              changePercent: null
            },
            correlation: calculateCorrelation(comparison)
          }

          // Calculate change for project 1
          if (validData1.length >= 2) {
            const first = validData1[0].project1Value!
            const last = validData1[validData1.length - 1].project1Value!
            stats.project1.change = last - first
            stats.project1.changePercent = first !== 0 ? ((last - first) / first) * 100 : null
          }

          // Calculate change for project 2
          if (validData2.length >= 2) {
            const first = validData2[0].project2Value!
            const last = validData2[validData2.length - 1].project2Value!
            stats.project2.change = last - first
            stats.project2.changePercent = first !== 0 ? ((last - first) / first) * 100 : null
          }

          setComparisonStats(stats)
        }

      } catch (err) {
        console.error('Error loading comparison data:', err)
        setError('Failed to load comparison data')
      } finally {
        setLoading(false)
      }
    }

    loadComparisonData()
  }, [selectedProject1, selectedProject2, selectedMetric, selectedRange])

  const canCompare = selectedProject1 && selectedProject2 && selectedMetric && 
                    availableMetrics.find(m => m.key === selectedMetric)?.available

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Compare Projects</h1>
        <p className="text-muted-foreground">
          Compare metrics between two projects to identify trends, correlations, and performance differences.
        </p>
      </div>

      {/* Project Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject1}
              onProjectSelect={setSelectedProject1}
              placeholder="Select first project..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject2}
              onProjectSelect={setSelectedProject2}
              placeholder="Select second project..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Metric Selection */}
      {selectedProject1 && selectedProject2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Metric to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricSelector
              metrics={availableMetrics}
              selectedMetric={selectedMetric}
              onMetricSelect={setSelectedMetric}
            />
          </CardContent>
        </Card>
      )}

      {/* Comparison Stats */}
      {canCompare && comparisonStats && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{selectedProject1?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Latest:</span>
                <span className="font-medium">{formatNumber(comparisonStats.project1.latest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Change:</span>
                <div className="flex items-center gap-1">
                  {comparisonStats.project1.changePercent !== null && (
                    <>
                      {comparisonStats.project1.changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-sm ${comparisonStats.project1.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(comparisonStats.project1.changePercent)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{selectedProject2?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Latest:</span>
                <span className="font-medium">{formatNumber(comparisonStats.project2.latest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Change:</span>
                <div className="flex items-center gap-1">
                  {comparisonStats.project2.changePercent !== null && (
                    <>
                      {comparisonStats.project2.changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-sm ${comparisonStats.project2.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(comparisonStats.project2.changePercent)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Correlation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Coefficient:</span>
                <span className="font-medium">
                  {comparisonStats.correlation !== null ? comparisonStats.correlation.toFixed(3) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Strength:</span>
                <Badge variant={
                  comparisonStats.correlation === null ? 'outline' :
                  Math.abs(comparisonStats.correlation) > 0.7 ? 'default' :
                  Math.abs(comparisonStats.correlation) > 0.3 ? 'secondary' : 'outline'
                }>
                  {comparisonStats.correlation === null ? 'Unknown' :
                   Math.abs(comparisonStats.correlation) > 0.7 ? 'Strong' :
                   Math.abs(comparisonStats.correlation) > 0.3 ? 'Moderate' : 'Weak'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {canCompare && comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {availableMetrics.find(m => m.key === selectedMetric)?.name} Comparison
              </CardTitle>
              <div className="flex gap-2">
                {timeRanges.map((range) => (
                  <Button
                    key={range.label}
                    variant={selectedRange === range.label.toLowerCase() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRange(range.label.toLowerCase())}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                project1: {
                  label: selectedProject1?.name || 'Project 1',
                  color: '#3b82f6',
                },
                project2: {
                  label: selectedProject2?.name || 'Project 2',
                  color: '#ef4444',
                }
              }}
              className="h-[400px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-2">{format(new Date(label), 'MMM dd, yyyy')}</p>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm">
                                  {entry.name}: {formatNumber(entry.value as number)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="project1Value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name={selectedProject1?.name || 'Project 1'}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="project2Value"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name={selectedProject2?.name || 'Project 2'}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Loading and Error States */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProject1 && !selectedProject2 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Start Comparing Projects</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select two projects above to compare their metrics and discover insights about their performance and correlation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
