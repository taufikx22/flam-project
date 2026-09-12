import React from 'react';
import { generateInitialDataset } from '@/lib/dataGenerator';
import { DataProvider } from '@/components/providers/DataProvider';
import { DashboardUIProvider } from '@/components/providers/DashboardUIProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

/**
 * Main Enterprise Dashboard Page — Next.js Server Component.
 * Synthesizes initial 10,000 point telemetry dataset server-side,
 * then activates the DataProvider, DashboardUIProvider, and DashboardShell
 * for high-performance 60 FPS Canvas rendering and enterprise navigation.
 */
export default async function DashboardPage() {
  const initialData = generateInitialDataset(10000, 100);

  return (
    <DataProvider initialData={initialData}>
      <DashboardUIProvider>
        <DashboardShell>
          <DashboardClient />
        </DashboardShell>
      </DashboardUIProvider>
    </DataProvider>
  );
}
