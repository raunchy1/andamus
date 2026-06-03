"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * CRIT-12 FIX: The ErrorFallback component must NOT use hooks that depend on
 * context providers (like useTranslations from next-intl). If the translation
 * provider itself crashed, calling useTranslations would throw again, creating
 * an infinite crash loop.
 *
 * Solution: use hardcoded static text (multilingual) that is completely
 * self-contained and cannot throw.
 */
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 max-w-md backdrop-blur-sm">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-red-500/15 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Qualcosa è andato storto / Something went wrong
        </h2>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Si è verificato un errore imprevisto. Ricarica la pagina o riprova più
          tardi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10"
          >
            ↻ Riprova / Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Ricarica / Reload
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
        )
      );
    }

    return this.props.children;
  }
}
