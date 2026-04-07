"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
            <p className="text-red-500 font-semibold mb-2">Qualcosa è andato storto</p>
            <p className="text-gray-400 text-sm mb-4">Ricarica la pagina per riprovare</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Riprova
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
