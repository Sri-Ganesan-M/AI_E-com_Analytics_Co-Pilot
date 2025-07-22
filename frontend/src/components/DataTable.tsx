import type { HistoryItem } from '../types';

interface DataTableProps {
  data: HistoryItem['payload']['result'];
}

export default function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  return (
    <div className="table-responsive">
      <table className="table table-dark table-striped table-hover mb-0">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="text-capitalize">{header.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`}>{String(row[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}