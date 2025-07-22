import React, { useState, useRef } from 'react';
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

  // Use a ref to hold mutable variables that don't need to trigger re-renders
  const streamState = useRef({
    textBuffer: '',
    animationFrameId: 0,
    isStreamClosed: false,
  });

  const handleAskQuestion = async (question: string) => {
    setStatus('loading');
    const newId = `conv_${Date.now()}`;
    setSelectedConversationId(newId);
    
    const tempHistoryItem: HistoryItem = { id: newId, question, payload: { generated_sql: 'Generating SQL...', result: [], chart_data: null }, explanation: '' };
    const previousHistory = history.map(item => ({ question: item.question, explanation: item.explanation }));
    setHistory(prev => [tempHistoryItem, ...prev]);

    // Reset the mutable state for the new stream
    streamState.current.textBuffer = '';
    streamState.current.isStreamClosed = false;
    
    let finalPayload: InitialPayload | null = null;

    const animationLoop = () => {
      // If there's text in the buffer, render it
      if (streamState.current.textBuffer.length > 0) {
        // Render a few characters per frame for a fast but smooth effect
        const charsToRender = streamState.current.textBuffer.slice(0, 3);
        streamState.current.textBuffer = streamState.current.textBuffer.slice(3);

        setHistory(prev =>
          prev.map(item =>
            item.id === newId
              ? { ...item, explanation: item.explanation + charsToRender }
              : item
          )
        );
      }
      
      // If the stream is closed and the buffer is empty, stop the loop
      if (streamState.current.isStreamClosed && streamState.current.textBuffer.length === 0) {
        cancelAnimationFrame(streamState.current.animationFrameId);
        if (status !== 'error') setStatus('success');
        return;
      }

      // Otherwise, schedule the next frame
      streamState.current.animationFrameId = requestAnimationFrame(animationLoop);
    };

    // Start the animation loop
    streamState.current.animationFrameId = requestAnimationFrame(animationLoop);

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
          streamState.current.isStreamClosed = true; // Signal the loop to stop
          return;
        }
        if (ev.event === 'initial_data') {
          finalPayload = JSON.parse(ev.data);
          // Set the payload as soon as it arrives
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, payload: finalPayload! } : item));
        } else if (ev.event === 'text_chunk') {
          // Add incoming text to the buffer. The animation loop will render it.
          streamState.current.textBuffer += ev.data;
        }
      },
      onerror(err) {
        setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: "A network error occurred. Please ensure the backend server is running and accessible." } : item));
        setStatus('error');
        streamState.current.isStreamClosed = true; // Signal the loop to stop
        throw err;
      },
      onclose() {
        // When the stream closes, just signal the animation loop to finish its work and stop.
        // This avoids any race conditions.
        streamState.current.isStreamClosed = true;
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