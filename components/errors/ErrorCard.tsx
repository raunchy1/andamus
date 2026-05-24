"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ title, message, onRetry, className = "" }: ErrorCardProps) {
  const t = useTranslations("common");

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center gap-4 ${className}`}>
      <AlertTriangle className="w-10 h-10 text-error" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-on-surface">
          {title || t("errorTitle")}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-xs">
          {message || t("errorMessage")}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          {t("retry")}
        </button>
      )}
    </div>
  );
}
