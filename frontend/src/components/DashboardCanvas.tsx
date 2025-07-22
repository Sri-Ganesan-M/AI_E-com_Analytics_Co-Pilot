import { Bot, Download } from 'lucide-react';
import InteractiveChart from './InteractiveChart';
import DataTable from './DataTable';
import type { HistoryItem } from '../types';

type Status = 'idle' | 'loading' | 'error' | 'success';

interface CanvasProps {
  status: Status;
  conversation: HistoryItem | null;
}

export default function DashboardCanvas({ status, conversation }: CanvasProps) {
  
  const handleDownloadCSV = (data: HistoryItem['payload']['result']) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')]; // Header row

    // Helper to escape fields containing commas or quotes
    const escapeCsvField = (field: any) => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    // Data rows
    for (const row of data) {
        const values = headers.map(header => escapeCsvField(row[header]));
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data_export_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const WelcomeScreen = () => (
    <div className="text-center text-muted">
      <Bot size={64} className="mx-auto" />
      <h1 className="mt-4 display-5">AI Data Analyst</h1>
      <p className="lead">Select a conversation or ask a new question to begin.</p>
    </div>
  );
  
  if (!conversation) {
    return (
        <div className="col-8 p-4 d-flex align-items-center justify-content-center">
          <WelcomeScreen />
        </div>
    );
  }

  const { question, payload, explanation } = conversation;

  return (
    <div className="col-8 p-4 overflow-auto">
      <div className="d-flex flex-column gap-4">
        <h1 className="display-6">{question}</h1>

        <div className="p-4 bg-dark rounded-3">
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
            {explanation}
            {status === 'loading' && payload.result.length === 0 && <span className="spinner-grow spinner-grow-sm ms-2" />}
          </p>
        </div>
        
        {payload.chart_data && <InteractiveChart chartData={payload.chart_data} />}

        {payload.result.length > 0 && (
            <div className="card bg-dark border-secondary">
              <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Data Table</h5>
                <button 
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  onClick={() => handleDownloadCSV(payload.result)}
                >
                  <Download size={14} />
                  Download CSV
                </button>
              </div>
              <div className="card-body p-0">
                <DataTable data={payload.result} />
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
