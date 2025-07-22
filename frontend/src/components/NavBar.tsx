// src/components/NavBar.tsx
import { BrainCircuit } from 'lucide-react';

export default function NavBar() {
  return (
    <nav 
      className="navbar navbar-expand-lg navbar-dark px-4" 
      style={{
        backgroundColor: 'rgba(0,0,0,0.3)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="#">
          <BrainCircuit size={28} className="text-primary" />
          <span className="fw-bold fs-4">AI E-commerce Analyst</span>
        </a>
      </div>
    </nav>
  );
}