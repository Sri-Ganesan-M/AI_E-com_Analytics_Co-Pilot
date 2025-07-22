import  { useState, useMemo } from 'react';
import type { HistoryItem } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps {
  data: HistoryItem['payload']['result'];
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable({ data }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const stringA = String(aValue).toLowerCase();
      const stringB = String(bValue).toLowerCase();
      if (stringA < stringB) return sortDirection === 'asc' ? -1 : 1;
      if (stringA > stringB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    if (sortDirection === 'asc') return <ArrowUp size={14} className="ms-1" />;
    if (sortDirection === 'desc') return <ArrowDown size={14} className="ms-1" />;
    return null;
  };

  return (
    <div className="table-responsive">
      <table className="table table-dark table-striped table-hover mb-0">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" onClick={() => handleSort(header)} style={{ cursor: 'pointer' }} className="text-capitalize">
                <div className="d-flex align-items-center">{header.replace(/_/g, ' ')}<SortIcon column={header} /></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header) => (<td key={`${rowIndex}-${header}`}>{String(row[header])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}