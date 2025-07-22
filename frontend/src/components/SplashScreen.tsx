import { BrainCircuit } from 'lucide-react';
import './splashscreen.css';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <BrainCircuit size={80} className="splash-icon" />
        <h1 className="splash-title">AI E-com Analytics Co-Pilot</h1>
        <p className="splash-quote">Unlocking insights, one query at a time.</p>
      </div>
    </div>
  );
}