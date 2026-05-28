"use client";

import { Layout } from "./Layout";
import { OnboardingModal } from "./OnboardingModal";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      {children}
      <OnboardingModal />
      <PWAInstallPrompt />
    </Layout>
  );
}
