import { BrainCircuit } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary-subtle px-4">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="#">
          <BrainCircuit size={28} className="text-primary" />
          <span className="fw-bold fs-4">AI E-commerce Analyst</span>
        </a>
      </div>
    </nav>
  );
}