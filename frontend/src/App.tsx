import  { useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { InitialPayload, HistoryItem } from './types';
import ConversationHistory from './components/ConversationHistory';
import DashboardCanvas from './components/DashboardCanvas';
import NavBar from './components/NavBar';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleAskQuestion = async (question: string) => {
    setStatus('loading');
    const newId = `conv_${Date.now()}`;
    setSelectedConversationId(newId);
    const tempHistoryItem: HistoryItem = { id: newId, question, payload: { generated_sql: 'Generating SQL...', result: [], chart_data: null }, explanation: '' };
    const previousHistory = history.map(item => ({ question: item.question, explanation: item.explanation }));
    setHistory(prev => [tempHistoryItem, ...prev]);

    let finalPayload: InitialPayload | null = null;
    let finalExplanation = '';

    await fetchEventSource(`${API_URL}/ask-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history: previousHistory }),
      onmessage(ev) {
        if (ev.event === 'error') {
          const errorData = JSON.parse(ev.data);
          const errorMessage = `An error occurred: ${errorData.error}\n\nAttempted SQL:\n${errorData.sql || 'Not available'}`;
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: errorMessage, payload: { generated_sql: errorData.sql || 'Failed to generate', result: [], chart_data: null } } : item));
          setStatus('error');
          return;
        }
        if (ev.event === 'initial_data') {
          finalPayload = JSON.parse(ev.data);
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, payload: finalPayload! } : item));
        } else if (ev.event === 'text_chunk') {
          finalExplanation += ev.data;
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: finalExplanation } : item));
        }
      },
      onerror(err) {
        setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: "A network error occurred. Please ensure the backend server is running and accessible." } : item));
        setStatus('error');
        throw err;
      },
      onclose() {
        if (status !== 'error') {
          if (finalPayload) {
            const finalHistoryItem: HistoryItem = { id: newId, question, payload: finalPayload, explanation: finalExplanation };
            setHistory(prev => prev.map(item => item.id === newId ? finalHistoryItem : item));
          }
          setStatus('success');
        }
      }
    });
  };

  const selectedConversation = history.find(item => item.id === selectedConversationId) || null;

  return (
    <div className="d-flex flex-column vh-100 text-light">
      <NavBar />
      <main className="d-flex flex-row flex-grow-1" style={{ overflow: 'hidden' }}>
        <ConversationHistory history={history} selectedId={selectedConversationId} onSelect={setSelectedConversationId} onAsk={handleAskQuestion} isLoading={status === 'loading'} />
        <DashboardCanvas status={status} conversation={selectedConversation} onAsk={handleAskQuestion} />
      </main>
    </div>
  );
}