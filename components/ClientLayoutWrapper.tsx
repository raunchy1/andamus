"use client";

import { ViewModeProvider } from "./view-mode";
import { Layout } from "./Layout";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <Layout>{children}</Layout>
    </ViewModeProvider>
  );
}
