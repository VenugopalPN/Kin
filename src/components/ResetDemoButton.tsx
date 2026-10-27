import { useNavigate } from 'react-router-dom';
import { resetDemo } from '../lib/store.ts';
import './ResetDemoButton.css';

export function ResetDemoButton() {
  const navigate = useNavigate();

  function handleReset() {
    const confirmed = window.confirm('Reset the demo? This clears every website, campaign, and gift on this computer.');
    if (!confirmed) return;
    resetDemo();
    navigate('/');
  }

  return (
    <button type="button" className="reset-demo-button" onClick={handleReset}>
      Reset demo
    </button>
  );
}
