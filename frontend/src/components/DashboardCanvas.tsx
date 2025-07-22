import { Bot } from 'lucide-react';
import InteractiveChart from './InteractiveChart';
import DataTable from './DataTable';
import type { HistoryItem } from '../types';

type Status = 'idle' | 'loading' | 'error' | 'success';

interface CanvasProps {
  status: Status;
  conversation: HistoryItem | null;
}

export default function DashboardCanvas({ status, conversation }: CanvasProps) {
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
             <div className="card-header border-secondary h5 mb-0">Data Table</div>
             <div className="card-body">
               <DataTable data={payload.result} />
             </div>
           </div>
        )}
      </div>
    </div>
  );
}