"use client";

import React, { useState, useEffect } from "react";
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
  const [discordMessages, setDiscordMessages] = useState<DiscordMessage[]>([]);
  const [twitterMessages, setTwitterMessages] = useState<TwitterMessage[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  const [githubCommits, setGithubCommits] = useState<GitHubCommit[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Exécuter toutes les requêtes en parallèle pour améliorer les performances
        const [
          projectResult,
          histDataResult,
          colorDataResult,
          discordResult,
          twitterResult,
          telegramResult,
          githubResult
        ] = await Promise.allSettled([
          // Fetch project details
          supabase
            .from('project')
            .select('name, description')
            .eq('id', projectId)
            .single(),

          // Fetch historical data avec limite pour éviter les requêtes trop lourdes
          supabase
            .from('data')
            .select('*')
            .eq('id', projectId)
            .order('date', { ascending: true })
            .limit(1000), // Limite pour éviter les requêtes trop lourdes

          // Fetch color mappings
          supabase
            .from('color')
            .select('*'),

          // Fetch Discord messages
          supabase
            .from('discord_duplicate')
            .select('date, author, avatar, content')
            .eq('id', projectId)
            .order('date', { ascending: false })
            .limit(10),

          // Fetch Twitter messages
          supabase
            .from('twitter')
            .select('date, author, author_id, avatar, content, like, retweet, quote, comment')
            .eq('id', projectId)
            .order('date', { ascending: false })
            .limit(10),

          // Fetch Telegram messages
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

          // Fetch GitHub commits
          supabase
            .from('github')
            .select('date, author, content, comment, avatar')
            .eq('id', projectId)
            .order('date', { ascending: false })
            .limit(10)
        ]);

        // Traitement des résultats avec gestion d'erreur individuelle
        let hasMainData = false;

        // Project data
        if (projectResult.status === 'fulfilled' && projectResult.value.data) {
          setProjectName(projectResult.value.data.name || '');
          setProjectDescription(projectResult.value.data.description || '');
        }

        // Historical data (critique pour le dashboard)
        if (histDataResult.status === 'fulfilled' && histDataResult.value.data) {
          const histData = histDataResult.value.data;
          setHistoricalData(histData);
          hasMainData = true;

          // Color data
          let colorData = [];
          if (colorDataResult.status === 'fulfilled' && colorDataResult.value.data) {
            colorData = colorDataResult.value.data;
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
        }

        // Social media data (non-critique, ne bloque pas le dashboard)
        if (discordResult.status === 'fulfilled' && discordResult.value.data) {
          setDiscordMessages(discordResult.value.data);
        }

        if (twitterResult.status === 'fulfilled' && twitterResult.value.data) {
          setTwitterMessages(twitterResult.value.data);
        }

        if (telegramResult.status === 'fulfilled' && telegramResult.value.data) {
          setTelegramMessages(telegramResult.value.data);
        }

        if (githubResult.status === 'fulfilled' && githubResult.value.data) {
          setGithubCommits(githubResult.value.data);
        }

        // Si aucune donnée principale n'est disponible, afficher une erreur
        if (!hasMainData) {
          setError("No historical data available for this project");
        }

      } catch (error) {
        console.error("Error while loading data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadData();
    }
  }, [projectId]);

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

  const timeRanges = [
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1y", days: 365 },
    { label: "All", days: null },
  ];

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

      <SocialActivitySlider
        discordMessages={discordMessages}
        twitterMessages={twitterMessages}
        telegramMessages={telegramMessages}
        githubCommits={githubCommits}
      />
    </div>
  );
}
