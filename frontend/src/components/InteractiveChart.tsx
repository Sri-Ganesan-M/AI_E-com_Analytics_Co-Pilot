// src/components/InteractiveChart.tsx
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import type { ChartJSData } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

interface ChartProps {
  chartData: ChartJSData;
}

export default function InteractiveChart({ chartData }: ChartProps) {
  const axisOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { color: '#e0e0e0' } } },
    scales: {
      x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
    }
  };
  const pieOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { color: '#e0e0e0' } } },
  };

  const renderChart = () => {
    switch (chartData.type) {
      case 'line': return <Line options={axisOptions} data={chartData.data} />;
      case 'bar': return <Bar options={axisOptions} data={chartData.data} />;
      case 'pie': return <Pie options={pieOptions} data={chartData.data} />;
      default: return null;
    }
  };

  return <div className="p-3 rounded-3 card" style={{ height: '400px' }}>{renderChart()}</div>;
}