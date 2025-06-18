"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { SocialActivitySlider } from "@/components/social-activity-slider";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Metric {
  name: string;
  key: string;
  color: string;
  yAxisId?: string;
}

interface DataPoint {
  date: string;
  [key: string]: any;
}

interface Project {
  id: string;
  name: string;
  logo: string;
  description: string;
}

interface DiscordMessage {
  date: string;
  author: string;
  avatar: string;
  content: string;
}

interface TwitterMessage {
  date: string;
  author: string;
  author_id: string;
  avatar: string;
  content: string;
  like: number;
  retweet: number;
  quote: number;
  comment: number;
}

interface TelegramMessage {
  date: string;
  author: string;
  username: string;
  content: string;
  avatar: string;
}

interface GitHubCommit {
  date: string;
  author: string;
  content: string;
  comment: number;
  avatar: string;
}

// Helper function to format large numbers for the chart only
const formatYAxisTick = (value: number) => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(0)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(0)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(0)}K`;
  }
  return value;
};

export default function Dashboard() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState("30d");
  const [filteredData, setFilteredData] = useState<DataPoint[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  
  // Social media data states
  const [discordMessages, setDiscordMessages] = useState<DiscordMessage[]>([]);
  const [twitterMessages, setTwitterMessages] = useState<TwitterMessage[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  const [githubCommits, setGithubCommits] = useState<GitHubCommit[]>([]);
  
  // Social data loading states
  const [socialDataLoading, setSocialDataLoading] = useState(false);
  const [socialDataLoaded, setSocialDataLoaded] = useState(false);
  const [socialDataError, setSocialDataError] = useState<string | null>(null);

  const timeRanges = [
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1y", days: 365 },
    { label: "All", days: null },
  ];

  // Enhanced function to load individual social media platform data with timeout handling
  const loadPlatformData = useCallback(async (platform: string, queryBuilder: any, timeout = 10000) => {
    try {
      console.log(`Loading ${platform} data...`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${platform} query timeout`)), timeout);
      });
      
      // Race between the query and timeout
      const result = await Promise.race([queryBuilder, timeoutPromise]);
      
      const { data, error } = result as any;
      
      if (error) {
        console.error(`${platform} error:`, error);
        // Don't throw for timeout errors, just return empty array
        if (error.code === '57014' || error.message?.includes('timeout')) {
          console.warn(`${platform} query timed out, skipping...`);
          return [];
        }
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn(`${platform} returned invalid data:`, data);
        return [];
      }
      
      console.log(`${platform} loaded successfully: ${data.length} items`);
      return data;
    } catch (err: any) {
      console.error(`${platform} exception:`, err);
      // For timeout errors, return empty array instead of failing
      if (err.message?.includes('timeout') || err.code === '57014') {
        console.warn(`${platform} timed out, returning empty data`);
        return [];
      }
      return [];
    }
  }, []);

  // Optimized function to load all social media data with better error handling
  const loadSocialMediaData = useCallback(async () => {
    if (!projectId || socialDataLoading) return;
    
    console.log('Starting social media data load...');
    setSocialDataLoading(true);
    setSocialDataError(null);
    
    try {
      // Reset all data first
      setDiscordMessages([]);
      setTwitterMessages([]);
      setTelegramMessages([]);
      setGithubCommits([]);

      // Load platforms in parallel with individual timeout handling
      const [discordData, twitterData, telegramData, githubData] = await Promise.allSettled([
        // Discord with optimized query and shorter timeout
        loadPlatformData('Discord', 
          supabase
            .from('discord_duplicate')
            .select('date, author, avatar, content')
            .eq('id', projectId)
            .not('content', 'eq', '')
            .not('author', 'eq', '')
            .order('date', { ascending: false })
            .limit(10), // Reduced limit for faster query
          8000 // Shorter timeout
        ),
        
        // Twitter
        loadPlatformData('Twitter',
          supabase
            .from('twitter')
            .select('date, author, author_id, avatar, content, like, retweet, quote, comment')
            .eq('id', projectId)
            .not('content', 'eq', '')
            .not('author', 'eq', '')
            .order('date', { ascending: false })
            .limit(10),
          10000
        ),
        
        // Telegram
        loadPlatformData('Telegram',
          supabase
            .from('telegram_duplicate')
            .select('date, author, username, content, avatar')
            .eq('id', projectId)
            .eq('bot', false)
            .not('author', 'eq', '')
            .not('username', 'eq', '')
            .not('content', 'eq', '')
            .order('date', { ascending: false })
            .limit(10),
          10000
        ),
        
        // GitHub
        loadPlatformData('GitHub',
          supabase
            .from('github')
            .select('date, author, content, comment, avatar')
            .eq('id', projectId)
            .not('content', 'eq', '')
            .not('author', 'eq', '')
            .order('date', { ascending: false })
            .limit(10),
          10000
        )
      ]);
      
      // Process results, handling both successful and failed promises
      const processResult = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn('Platform data load failed:', result.reason);
          return [];
        }
      };
      
      const finalDiscordData = processResult(discordData);
      const finalTwitterData = processResult(twitterData);
      const finalTelegramData = processResult(telegramData);
      const finalGithubData = processResult(githubData);
      
      // Set all data at once
      console.log('Setting social media data:', {
        discord: finalDiscordData.length,
        twitter: finalTwitterData.length,
        telegram: finalTelegramData.length,
        github: finalGithubData.length
      });
      
      setDiscordMessages(finalDiscordData);
      setTwitterMessages(finalTwitterData);
      setTelegramMessages(finalTelegramData);
      setGithubCommits(finalGithubData);
      
      setSocialDataLoaded(true);
      console.log('Social media data loading completed');
      
    } catch (error: any) {
      console.error("Critical error loading social media data:", error);
      setSocialDataError("Some social media data could not be loaded due to server timeouts");
    } finally {
      setSocialDataLoading(false);
    }
  }, [projectId, socialDataLoading, loadPlatformData]);

  // Main data loading effect
  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        setSocialDataLoaded(false);

        // Fetch project details first
        const { data: projectData, error: projectError } = await supabase
          .from('project')
          .select('name, description')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Project fetch error:', projectError);
        } else if (projectData) {
          setProjectName(projectData.name || '');
          setProjectDescription(projectData.description || '');
        }

        // Fetch historical data with timeout
        const { data: histData, error: histError } = await supabase
          .from('data')
          .select('*')
          .eq('id', projectId)
          .order('date', { ascending: true })
          .limit(2500);

        if (histError) {
          console.error('Historical data fetch error:', histError);
          throw new Error("Failed to load historical data");
        }

        if (!histData || histData.length === 0) {
          setError("No historical data available for this project");
          return;
        }

        setHistoricalData(histData);

        // Fetch color mappings
        const { data: colorData, error: colorError } = await supabase
          .from('color')
          .select('*');

        if (colorError) {
          console.error('Color data fetch error:', colorError);
        }

        // Determine available metrics (non-null values)
        const availableMetrics = new Set<string>();
        histData.forEach(dataPoint => {
          Object.entries(dataPoint).forEach(([key, value]) => {
            if (value !== null && key !== 'id' && key !== 'date') {
              availableMetrics.add(key);
            }
          });
        });

        // Create metrics array with colors and yAxisId
        const metricsArray = Array.from(availableMetrics).map(key => {
          const colorMapping = colorData?.find(c => c.metric === key);
          return {
            name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            key,
            color: colorMapping?.color || '#000000',
            yAxisId: key === 'closing_price' || key === 'opening_price' ? 'right' : 'left'
          };
        });

        setMetrics(metricsArray);
        setSelectedMetrics(['twitter_post', 'twitter_user', 'twitter_retweet', 'closing_price']);

      } catch (error) {
        console.error("Error while loading data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Social media data loading effect - triggered after main data is loaded
  useEffect(() => {
    if (projectId && !loading && !socialDataLoaded && !socialDataLoading) {
      // Wait a bit for the main data to settle, then load social data
      const timer = setTimeout(() => {
        loadSocialMediaData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [projectId, loading, socialDataLoaded, socialDataLoading, loadSocialMediaData]);

  // Filtered data effect
  useEffect(() => {
    if (!historicalData.length) return;

    const range = timeRanges.find(r => r.label === selectedRange);
    if (!range?.days) {
      setFilteredData(historicalData);
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);

    const filtered = historicalData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });

    setFilteredData(filtered);
  }, [historicalData, selectedRange]);

  // Manual retry function
  const retrySocialMediaData = () => {
    setSocialDataLoaded(false);
    setSocialDataError(null);
    loadSocialMediaData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
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
      </div>
    );
  }

  if (!historicalData.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold capitalize">
          {projectName || 'Project'} dashboard
        </h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">No historical data available for this project.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((key) => key !== metricKey)
        : [...prev, metricKey]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold capitalize">
        {projectName || 'Project'} dashboard
      </h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historical data</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            {timeRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.label ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(range.label)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4">
            {metrics.map((metric) => (
              <div key={metric.key} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.key}
                  checked={selectedMetrics.includes(metric.key)}
                  onCheckedChange={() => toggleMetric(metric.key)}
                />
                <Label htmlFor={metric.key} className="text-sm">
                  {metric.name}
                </Label>
              </div>
            ))}
          </div>
          <ChartContainer
            config={metrics.reduce((acc, metric) => {
              acc[metric.key] = {
                label: metric.name,
                color: metric.color,
              };
              return acc;
            }, {})}
            className="h-[300px] md:h-[400px] lg:h-[600px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData}
                margin={{ 
                  top: 5, 
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={formatYAxisTick}
                  width={45}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatYAxisTick}
                  width={45}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {selectedMetrics.map((metricKey) => {
                  const metric = metrics.find((m) => m.key === metricKey);
                  return (
                    <Line
                      key={metricKey}
                      type="linear"
                      dataKey={metricKey}
                      stroke={metric?.color}
                      name={metric?.name}
                      strokeWidth={2}
                      dot={false}
                      yAxisId={metric?.yAxisId || "left"}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {projectDescription && (
        <Card>
          <CardHeader>
            <CardTitle>About {projectName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{projectDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* Social Activity Section with improved loading and error handling */}
      {socialDataLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading social activity...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : socialDataError ? (
        <Card>
          <CardHeader>
            <CardTitle>Social Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{socialDataError}</p>
              <Button onClick={retrySocialMediaData} variant="outline">
                Retry Loading Social Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SocialActivitySlider
          discordMessages={discordMessages}
          twitterMessages={twitterMessages}
          telegramMessages={telegramMessages}
          githubCommits={githubCommits}
        />
      )}
    </div>
  );
}
