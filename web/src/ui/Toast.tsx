import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useShowroom } from '../state/store';

export function Toast() {
  const toast = useShowroom((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => useShowroom.setState({ toast: null }), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.seq}>
          <Check size={16} strokeWidth={2} aria-hidden="true" />
          {toast.text}
        </div>
      )}
    </div>
  );
}
