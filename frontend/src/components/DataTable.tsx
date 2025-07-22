// src/components/DataTable.tsx

interface DataTableProps {
  data: Record<string, any>[];
}

export default function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted">No data to display in table.</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered table-hover mb-0">
        <thead className="table-dark">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="text-capitalize">
                {header.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`}>
                  {String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}