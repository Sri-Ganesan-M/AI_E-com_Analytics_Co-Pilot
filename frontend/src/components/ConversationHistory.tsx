// src/components/ConversationHistory.tsx
import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryProps {
  history: HistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAsk: (question: string) => void;
  isLoading: boolean;
}

export default function ConversationHistory({ history, selectedId, onSelect, onAsk, isLoading }: HistoryProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAsk(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div 
      className="col-4 d-flex flex-column p-3 h-100" 
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <h2 className="h5 mb-3 fw-bold text-light">Conversation History</h2>
      <div className="flex-grow-1 overflow-auto mb-3 pe-2">
        <div className="d-flex flex-column gap-2">
          {history.length === 0 && (<p className="text-center text-secondary mt-4">No conversations yet.</p>)}
          {history.map(item => (
            <button 
              key={item.id} 
              onClick={() => onSelect(item.id)} 
              className={`btn text-start p-2 d-flex align-items-center gap-2 rounded-3`} 
              style={{ 
                 transition: 'background-color 0.2s, transform 0.2s', 
                 backgroundColor: item.id === selectedId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(55, 65, 81, 0.3)',
                 transform: item.id === selectedId ? 'scale(1.02)' : 'scale(1)',
                 border: `1px solid ${item.id === selectedId ? 'rgba(59, 130, 246, 0.7)' : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              <MessageSquare size={16} className={item.id === selectedId ? 'text-white' : 'text-secondary'}/>
              <span className={`text-truncate ${item.id === selectedId ? 'text-white' : 'text-light'}`}>{item.question}</span>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="input-group bg-dark bg-opacity-50 p-1 rounded-pill shadow-inner border border-secondary">
          <span className="input-group-text bg-transparent border-0 ps-3"><Sparkles size={20} className="text-primary" /></span>
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Ask a new question..." 
            disabled={isLoading} 
            className="form-control form-control-lg bg-transparent border-0 text-light" 
            style={{ boxShadow: 'none', fontSize: '1rem' }} 
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()} 
            className="btn btn-primary rounded-circle m-1" 
            style={{width: '40px', height: '40px'}}
          >
            {isLoading ? <span className="spinner-border spinner-border-sm" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}