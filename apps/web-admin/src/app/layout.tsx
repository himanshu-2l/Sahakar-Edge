import React from 'react';

export const metadata = {
  title: 'Sahakar Edge — NCCT Cooperative Training Platform',
  description: 'National Council for Cooperative Training (NCCT) Central Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, backgroundColor: '#f8fafc', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
