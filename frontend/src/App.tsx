// src/App.tsx
import { useState } from 'react';
import CommandLog from './components/CommandLog';
import DashboardCanvas from './components/DashboardCanvas';
import type { HistoryItem, DashboardData } from './types';

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAskQuestion = async (question: string) => {
    if (!question || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCurrentDashboard({ question } as DashboardData);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: DashboardData = await response.json();

      if (data.error) {
        setError(data.error);
        setCurrentDashboard(null);
      } else {
        const newHistoryItem: HistoryItem = { question, response: data };
        setCurrentDashboard(data);
        if (!history.find(h => h.question === question)) {
            setHistory(prev => [newHistoryItem, ...prev]);
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error("Failed to fetch from API:", errorMessage);
      setError("Failed to connect to the backend. Please ensure it's running.");
      setCurrentDashboard(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerunCommand = (historyItem: HistoryItem) => {
    if (isLoading) return;
    setError(null);
    setCurrentDashboard(historyItem.response);
  };

  return (
    // Use Bootstrap's flex utilities for the main layout
    <main className="d-flex flex-column flex-md-row vh-100 bg-light">
      <CommandLog
        history={history}
        onAsk={handleAskQuestion}
        onRerun={handleRerunCommand}
        isLoading={isLoading}
      />
      <DashboardCanvas
        data={currentDashboard}
        isLoading={isLoading}
        error={error}
        apiUrl={API_URL}
      />
    </main>
  );
}