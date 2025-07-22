// src/types.ts
import type { ChartData } from 'chart.js';

interface LineChart { type: 'line'; data: ChartData<'line'>; }
interface BarChart { type: 'bar'; data: ChartData<'bar'>; }
interface PieChart { type: 'pie'; data: ChartData<'pie'>; }
export type ChartJSData = LineChart | BarChart | PieChart;

export interface InitialPayload {
  generated_sql: string;
  result: Record<string, any>[];
  chart_data: ChartJSData | null;
}

export interface HistoryItem {
  id: string;
  question: string;
  payload: InitialPayload;
  explanation: string;
}