// src/types.ts

/**
 * Defines the structure of the data returned by the backend API.
 */
export interface DashboardData {
  question: string;
  generated_sql: string;
  // result is an array of objects where keys are column names (string)
  // and values can be of any type (string, number, etc.).
  result: Record<string, any>[];
  explanation: string;
  plot_path: string | null;
  // This property is for handling API-level errors gracefully.
  error?: string;
}

/**
 * Defines the structure for an item in the command history log.
 */
export interface HistoryItem {
  question:string;
  response: DashboardData;
}