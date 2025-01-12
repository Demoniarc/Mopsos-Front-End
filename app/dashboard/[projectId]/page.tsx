"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/lib/supabase";

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
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("30d");
  const [filteredData, setFilteredData] = useState<DataPoint[]>([]);
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('project')
          .select('name')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        if (projectData) {
          setProjectName(projectData.name);
        }

        // Fetch historical data
        const { data: histData, error: histError } = await supabase
          .from('data')
          .select('*')
          .eq('id', projectId)
          .order('date', { ascending: true });

        if (histError) throw histError;

        // Fetch color mappings
        const { data: colorData, error: colorError } = await supabase
          .from('color')
          .select('*');

        if (colorError) throw colorError;

        if (histData) {
          setHistoricalData(histData);

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
          setSelectedMetrics(metricsArray.slice(0, 3).map(m => m.key));
        }
      } catch (error) {
        console.error("Error while loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
    return <p>Loading data...</p>;
  }

  if (!historicalData.length) {
    return <p>No data available.</p>;
  }

  const currentData = historicalData[historicalData.length - 1];
  const previousData = historicalData[historicalData.length - 2];

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

  function calculateChange(current: number, previous: number) {
    if (previous === 0) return "N/A";
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(2);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold capitalize">{projectName} dashboard</h1>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {currentData[metric.key].toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculateChange(currentData[metric.key], previousData[metric.key])}
                % from the previous day
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
