"use client";

import { Component, ReactNode } from "react";
import { useTranslations } from "next-intl";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("error");
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <p className="text-red-500 font-semibold mb-2">{t("somethingWentWrong")}</p>
      <p className="text-gray-400 text-sm mb-4">{t("reloadPage")}</p>
      <button
        onClick={onRetry}
        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        {t("retry")}
      </button>
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

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
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
