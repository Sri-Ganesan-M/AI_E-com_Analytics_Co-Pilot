import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface CommandBarProps {
  onAsk: (question: string) => void;
  isLoading: boolean;
}

export default function CommandBar({ onAsk, isLoading }: CommandBarProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAsk(inputValue.trim());
    }
  };

  return (
    <div className="p-3 bg-dark border-top border-secondary-subtle mt-auto">
      <div className="container-fluid">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-secondary">
              <Sparkles size={20} className="text-primary" />
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              placeholder="e.g., Show total sales by day"
              disabled={isLoading}
              className="form-control form-control-lg bg-transparent border-secondary text-light"
              style={{ boxShadow: 'none' }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="btn btn-primary"
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}