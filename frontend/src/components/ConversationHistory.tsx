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
    <div className="col-4 d-flex flex-column bg-black p-3 border-end border-secondary-subtle">
      <h2 className="h5 mb-3 fw-bold">Conversation History</h2>
      <div className="flex-grow-1 overflow-auto mb-3">
        <div className="d-flex flex-column gap-2">
          {history.length === 0 && (
            <p className="text-center text-muted mt-4">No conversations yet.</p>
          )}
          {history.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`btn text-start p-2 d-flex align-items-center gap-2 ${item.id === selectedId ? 'btn-primary' : 'btn-dark'}`}
            >
              <MessageSquare size={16} />
              <span className="text-truncate">{item.question}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Command Bar at the bottom */}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="input-group-text bg-dark border-secondary">
            <Sparkles size={20} className="text-primary" />
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="Ask a new question..."
            disabled={isLoading}
            className="form-control form-control-lg bg-dark border-secondary text-light"
            style={{ boxShadow: 'none' }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn btn-primary"
          >
            {isLoading ? <span className="spinner-border spinner-border-sm" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}