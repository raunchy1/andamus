"use client";

import { Layout } from "./Layout";
import { OnboardingModal } from "./OnboardingModal";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      {children}
      <OnboardingModal />
    </Layout>
  );
}
