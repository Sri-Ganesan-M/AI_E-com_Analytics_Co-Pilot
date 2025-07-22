import { useState, useRef, useEffect } from 'react'; // 1. Add useEffect
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { InitialPayload, HistoryItem } from './types';
import ConversationHistory from './components/ConversationHistory';
import DashboardCanvas from './components/DashboardCanvas';
import NavBar from './components/NavBar';
import StartupModal from './components/StartupModal';
import SplashScreen from './components/SplashScreen'; // 2. Import SplashScreen

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // 3. Manage the app's loading state
  const [appState, setAppState] = useState<'splashing' | 'warning' | 'ready'>('splashing');

  // Use a ref to hold mutable variables that don't need to trigger re-renders
  const streamState = useRef({
    textBuffer: '',
    animationFrameId: 0,
    isStreamClosed: false,
  });
  
  // 4. Effect to transition from splash screen to warning modal
  useEffect(() => {
    if (appState === 'splashing') {
      const timer = setTimeout(() => {
        setAppState('warning');
      }, 3000); // Show splash screen for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [appState]);

  const handleAskQuestion = async (question: string) => {
    // ... (This function remains unchanged)
    setStatus('loading');
    const newId = `conv_${Date.now()}`;
    setSelectedConversationId(newId);
    
    const tempHistoryItem: HistoryItem = { id: newId, question, payload: { generated_sql: 'Generating SQL...', result: [], chart_data: null }, explanation: '' };
    const previousHistory = history.map(item => ({ question: item.question, explanation: item.explanation }));
    setHistory(prev => [tempHistoryItem, ...prev]);

    streamState.current.textBuffer = '';
    streamState.current.isStreamClosed = false;
    
    let finalPayload: InitialPayload | null = null;

    const animationLoop = () => {
      if (streamState.current.textBuffer.length > 0) {
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
      
      if (streamState.current.isStreamClosed && streamState.current.textBuffer.length === 0) {
        cancelAnimationFrame(streamState.current.animationFrameId);
        if (status !== 'error') setStatus('success');
        return;
      }
      streamState.current.animationFrameId = requestAnimationFrame(animationLoop);
    };
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
          streamState.current.isStreamClosed = true;
          return;
        }
        if (ev.event === 'initial_data') {
          finalPayload = JSON.parse(ev.data);
          setHistory(prev => prev.map(item => item.id === newId ? { ...item, payload: finalPayload! } : item));
        } else if (ev.event === 'text_chunk') {
          streamState.current.textBuffer += ev.data;
        }
      },
      onerror(err) {
        setHistory(prev => prev.map(item => item.id === newId ? { ...item, explanation: "A network error occurred. Please ensure the backend server is running and accessible." } : item));
        setStatus('error');
        streamState.current.isStreamClosed = true;
        throw err;
      },
      onclose() {
        streamState.current.isStreamClosed = true;
      }
    });
  };

  const selectedConversation = history.find(item => item.id === selectedConversationId) || null;

  // 5. Update render logic based on the app state
  if (appState === 'splashing') {
    return <SplashScreen />;
  }

  return (
    <>
      <StartupModal show={appState === 'warning'} onClose={() => setAppState('ready')} />
      <div 
        className="d-flex flex-column vh-100 text-light"
        style={{ visibility: appState === 'ready' ? 'visible' : 'hidden' }}
      >
        <NavBar />
        <main className="d-flex flex-row flex-grow-1" style={{ overflow: 'hidden' }}>
          <ConversationHistory history={history} selectedId={selectedConversationId} onSelect={setSelectedConversationId} onAsk={handleAskQuestion} isLoading={status === 'loading'} />
          <DashboardCanvas status={status} conversation={selectedConversation} onAsk={handleAskQuestion} />
        </main>
      </div>
    </>
  );
}