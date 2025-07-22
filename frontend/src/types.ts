import type { ChartData } from 'chart.js';

// Define a specific interface for each chart type
interface LineChart {
  type: 'line';
  data: ChartData<'line'>;
}

interface BarChart {
  type: 'bar';
  data: ChartData<'bar'>;
}

// Add PieChart interface
interface PieChart {
  type: 'pie';
  data: ChartData<'pie'>;
}

// Create a union of all supported chart types
export type ChartJSData = LineChart | BarChart | PieChart;

// This holds the data returned from the backend before the text stream
export interface InitialPayload {
  generated_sql: string;
  result: Record<string, any>[];
  chart_data: ChartJSData | null;
}

// New type to hold a complete conversation history item
export interface HistoryItem {
  id: string; // A unique ID for each item
  question: string;
  payload: InitialPayload;
  explanation: string;
}