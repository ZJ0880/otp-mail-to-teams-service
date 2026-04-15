import { Injectable, Logger } from "@nestjs/common";

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface MetricSummary {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  lastValue: number;
  lastTimestamp: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics: Map<string, Metric[]> = new Map();
  private readonly maxMetricsPerName = 1000;

  /**
   * Record a counter metric (increment by 1 or custom value)
   */
  recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.addMetric(name, value, tags);
    this.logger.debug(`Counter: ${name}=${value}`, { tags });
  }

  /**
   * Record a gauge metric (snapshot value)
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.addMetric(name, value, tags);
    this.logger.debug(`Gauge: ${name}=${value}`, { tags });
  }

  /**
   * Record a histogram metric (duration, latency, etc.)
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.addMetric(name, value, tags);
    this.logger.debug(`Histogram: ${name}=${value}ms`, { tags });
  }

  /**
   * Get aggregated metrics summary
   */
  getSummary(): Record<string, MetricSummary> {
    const summary: Record<string, MetricSummary> = {};

    this.metrics.forEach((metricList, name) => {
      if (metricList.length === 0) return;

      const values = metricList.map((m) => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const avg = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const lastMetric = metricList.at(-1)!;

      summary[name] = {
        count,
        sum,
        avg: Number.parseFloat(avg.toFixed(2)),
        min,
        max,
        lastValue: lastMetric.value,
        lastTimestamp: lastMetric.timestamp,
      };
    });

    return summary;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.logger.log("All metrics reset");
  }

  private addMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });

    // Keep only recent metrics to avoid memory overflow
    if (metricList.length > this.maxMetricsPerName) {
      metricList.shift();
    }
  }
}
