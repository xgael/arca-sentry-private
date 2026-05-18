"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Page error boundary:", error);
  }, [error]);

  return (
    <main className="error-boundary">
      <div className="error-card">
        <div className="error-icon" aria-hidden="true">⚠</div>
        <h1 className="error-title">Something went wrong</h1>
        <p className="error-desc">
          The page hit an unexpected error. The backend may be unavailable, or
          this view is in a state we didn&apos;t anticipate.
        </p>
        {error.message && (
          <code className="error-detail">{error.message}</code>
        )}
        <div className="error-actions">
          <button type="button" className="btn-primary" onClick={reset}>
            ↻ Try again
          </button>
          <Link href="/" className="btn-secondary">← Back to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
