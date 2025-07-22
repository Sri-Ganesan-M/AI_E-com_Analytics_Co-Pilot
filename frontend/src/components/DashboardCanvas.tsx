// src/components/DashboardCanvas.tsx
import DataTable from './DataTable';
import { BarChart2, AlertTriangle, Code } from 'lucide-react';
import type { DashboardData } from '../types';

interface DashboardCanvasProps {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  apiUrl: string;
}

export default function DashboardCanvas({ data, isLoading, error, apiUrl }: DashboardCanvasProps) {
  const WelcomeScreen = () => (
    <div className="text-center text-muted">
      <BarChart2 size={48} className="mx-auto" />
      <h2 className="mt-4 h3">Welcome to the Live Dashboard</h2>
      <p className="mt-2">Ask a question in the command bar to generate a report.</p>
    </div>
  );

  const LoadingScreen = () => (
    <div className="text-center text-primary">
       <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <h2 className="mt-4 h3">Generating Insights...</h2>
      <p className="mt-2 text-muted">The AI is analyzing your data for "{data?.question}"</p>
    </div>
  );

  const ErrorScreen = () => (
    <div className="alert alert-danger d-flex align-items-center">
      <AlertTriangle size={48} className="me-3" />
      <div>
        <h4 className="alert-heading">An Error Occurred</h4>
        <p className="mb-0 font-monospace">{error}</p>
      </div>
    </div>
  );

  const RenderContent = () => {
    if (isLoading) return <LoadingScreen />;
    if (error) return <ErrorScreen />;
    if (!data || !data.question) return <WelcomeScreen />;
    
    const { question, explanation, plot_path, result, generated_sql } = data;

    return (
      <div className="container-fluid d-flex flex-column gap-4">
        <div>
          <h2 className="h2 fw-bold">{question}</h2>
          {explanation && <p className="lead text-muted">{explanation}</p>}
        </div>

        {plot_path && (
          <div className="card shadow-sm">
            <div className="card-body">
              <img src={`${apiUrl}/${plot_path}`} alt={`Plot for ${question}`} className="img-fluid rounded" />
            </div>
          </div>
        )}

        {result && result.length > 0 && (
          <div className="card shadow-sm">
            <div className="card-header"><h3 className="h5 mb-0">Data Table</h3></div>
            <div className="card-body">
              <DataTable data={result} />
            </div>
          </div>
        )}
        
        {generated_sql && (
          <div className="card shadow-sm">
            <div className="card-header"><h3 className="h5 mb-0 d-flex align-items-center gap-2"><Code size={18}/> Generated SQL</h3></div>
            <div className="card-body bg-dark text-light rounded-bottom">
              <pre className="mb-0"><code className="text-white-50">{generated_sql}</code></pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
      <div className="d-flex align-items-center justify-content-center h-100">
        <RenderContent />
      </div>
    </div>
  );
}