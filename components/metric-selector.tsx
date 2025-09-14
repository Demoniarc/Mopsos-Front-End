"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface MetricInfo {
  key: string
  name: string
  available: boolean
}

interface MetricSelectorProps {
  metrics: MetricInfo[]
  selectedMetric: string
  onMetricSelect: (metric: string) => void
}

export function MetricSelector({ metrics, selectedMetric, onMetricSelect }: MetricSelectorProps) {
  const availableMetrics = metrics.filter(m => m.available)
  const unavailableMetrics = metrics.filter(m => !m.available)

  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select two projects to see available metrics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {availableMetrics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Available for comparison</h4>
            <Badge variant="default">{availableMetrics.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableMetrics.map((metric) => (
              <Button
                key={metric.key}
                variant={selectedMetric === metric.key ? "default" : "outline"}
                className="justify-between h-auto p-3"
                onClick={() => onMetricSelect(metric.key)}
              >
                <span className="text-left">{metric.name}</span>
                {selectedMetric === metric.key && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {unavailableMetrics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-muted-foreground">Not available for both projects</h4>
            <Badge variant="outline">{unavailableMetrics.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {unavailableMetrics.map((metric) => (
              <Button
                key={metric.key}
                variant="outline"
                className="justify-start h-auto p-3 opacity-50 cursor-not-allowed"
                disabled
              >
                <span className="text-left">{metric.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {availableMetrics.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No common metrics found between the selected projects.</p>
          <p className="text-sm mt-2">Try selecting different projects that share similar data points.</p>
        </div>
      )}
    </div>
  )
}
