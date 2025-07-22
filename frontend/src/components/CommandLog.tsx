// src/components/CommandLog.tsx
import React, { useState } from 'react';
import { Bot, Send, History } from 'lucide-react';
import type { HistoryItem } from '../types';

interface CommandLogProps {
  history: HistoryItem[];
  onAsk: (question: string) => void;
  onRerun: (item: HistoryItem) => void;
  isLoading: boolean;
}

export default function CommandLog({ history, onAsk, onRerun, isLoading }: CommandLogProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAsk(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="col-12 col-md-4 col-lg-3 d-flex flex-column bg-white border-end vh-100">
      <header className="p-3 border-bottom d-flex align-items-center gap-3">
        <Bot className="text-primary" size={24} />
        <h1 className="h5 mb-0 fw-bold">E-Commerce AI Analyst</h1>
      </header>

      <div className="flex-grow-1 p-3 overflow-auto">
        <h2 className="h6 text-muted mb-3 d-flex align-items-center gap-2">
          <History size={16} />
          Command History
        </h2>
        <div className="d-flex flex-column gap-2">
          {history.length === 0 && (
            <p className="text-center text-muted mt-4">No commands yet.</p>
          )}
          {history.map((item, index) => (
            <button
              key={index}
              onClick={() => onRerun(item)}
              className="btn btn-outline-secondary text-start"
            >
              {item.question}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-top bg-light">
        <div className="input-group">
          <input
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="form-control"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn btn-primary"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}