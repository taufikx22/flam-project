import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'PULSE60 • Ultra-Performance Real-Time Telemetry Platform (10k+ Pts @ 60 FPS)',
  description:
    'High-performance real-time telemetry dashboard rendering 10,000+ to 100,000+ data points at 60fps with zero memory leaks using Next.js 14+ App Router, Canvas+SVG hybrid architecture, ring buffers, and LTTB downsampling.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@500,700,800&f[]=supreme@400,500,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f0f2f5] text-[#111827] font-sans min-h-screen antialiased selection:bg-[#06d6a0] selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
