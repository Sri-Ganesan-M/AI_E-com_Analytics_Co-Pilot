import { useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { InitialPayload, HistoryItem } from './types';
import ConversationHistory from './components/ConversationHistory';
import DashboardCanvas from './components/DashboardCanvas';

const API_URL = "http://127.0.0.1:8000";
type Status = 'idle' | 'loading' | 'error' | 'success';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleAskQuestion = async (question: string) => {
    setStatus('loading');
    const newId = `conv_${Date.now()}`;
    setSelectedConversationId(newId);

    // Temporary history item while loading
    const tempHistoryItem: HistoryItem = {
      id: newId,
      question,
      payload: { generated_sql: '', result: [], chart_data: null },
      explanation: ''
    };
    setHistory(prev => [tempHistoryItem, ...prev]);

    let finalPayload: InitialPayload | null = null;
    let finalExplanation = '';

    await fetchEventSource(`${API_URL}/ask-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      onmessage(ev) {
        if (ev.event === 'initial_data') {
          finalPayload = JSON.parse(ev.data);
          // Update the temporary item with initial data
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, payload: finalPayload! } : item));
        } else if (ev.event === 'text_chunk') {
          finalExplanation += ev.data;
          // Update the explanation live
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: finalExplanation } : item));
        }
      },
      onerror(err) {
        setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: "An error occurred." } : item));
        setStatus('error');
        throw err;
      },
      onclose() {
        // Finalize the history item
        if (finalPayload) {
          const finalHistoryItem: HistoryItem = { id: newId, question, payload: finalPayload, explanation: finalExplanation };
          setHistory(prev => prev.map(item => item.id === newId ? finalHistoryItem : item));
        }
        setStatus('success');
      }
    });
  };

  const selectedConversation = history.find(item => item.id === selectedConversationId) || null;

  return (
    <main className="d-flex flex-row vh-100 bg-dark text-light">
      <ConversationHistory
        history={history}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
        onAsk={handleAskQuestion}
        isLoading={status === 'loading'}
      />
      <DashboardCanvas
        status={status}
        conversation={selectedConversation}
      />
    </main>
  );
}