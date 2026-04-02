"use client";

import { ViewModeProvider } from "./view-mode";
import { Layout } from "./Layout";
import { OnboardingModal } from "./OnboardingModal";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <Layout>
        {children}
        <OnboardingModal />
      </Layout>
    </ViewModeProvider>
  );
}
