import { Bot, Download } from 'lucide-react';
import InteractiveChart from './InteractiveChart';
import DataTable from './DataTable';
import type { HistoryItem } from '../types';

type Status = 'idle' | 'loading' | 'error' | 'success';

interface CanvasProps {
  status: Status;
  conversation: HistoryItem | null;
  onAsk: (question: string) => void;
}

export default function DashboardCanvas({ status, conversation, onAsk }: CanvasProps) {
  const handleDownloadCSV = (data: HistoryItem['payload']['result']) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const escapeCsvField = (field: any) => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) return `"${stringField.replace(/"/g, '""')}"`;
        return stringField;
    };
    const csvRows = [headers.join(','), ...data.map(row => headers.map(header => escapeCsvField(row[header])).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `data_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const WelcomeScreen = () => {
    const promptStarters = ["What were my total sales each day last month?", "Which 10 products have the highest total sales?", "What is the overall RoAS?", "Show me the ad spend for the top 5 products."];
    return (
      <div className="text-center text-muted d-flex flex-column justify-content-center align-items-center h-100">
        <Bot size={64} className="mx-auto text-primary" />
        <h1 className="mt-4 display-5 fw-bold text-light">E-com Analytics Co-Pilot</h1>
        <p className="lead text-secondary mb-5">Select a conversation or ask a new question to begin.</p>
        <div className="d-flex flex-wrap justify-content-center gap-3 px-5">
          {promptStarters.map((prompt, index) => (<button key={index} className="btn prompt-starter-btn px-3 py-2" onClick={() => onAsk(prompt)}>{prompt}</button>))}
        </div>
      </div>
    );
  };
  
  if (!conversation) return <div className="col-8 p-4 d-flex align-items-center justify-content-center"><WelcomeScreen /></div>;

  const { question, payload, explanation } = conversation;

  return (
    <div className="col-8 p-4 overflow-auto">
      <div className="d-flex flex-column gap-4">
        <h1 className="display-6">{question}</h1>
        <div className="p-4 rounded-3 card"><p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{explanation}{status === 'loading' && payload.result.length === 0 && <span className="spinner-grow spinner-grow-sm ms-2" />}</p></div>
        {payload.chart_data && <InteractiveChart chartData={payload.chart_data} />}
        {payload.result.length > 0 && (
          <div className="card border-secondary">
            <div className="card-header border-secondary d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Data Table</h5>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => handleDownloadCSV(payload.result)}><Download size={14} />Download CSV</button>
            </div>
            <div className="card-body p-0"><DataTable data={payload.result} /></div>
          </div>
        )}
      </div>
    </div>
  );
}