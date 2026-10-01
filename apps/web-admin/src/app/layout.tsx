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
      <body
        style={{
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          backgroundColor: '#f9fafb',
          color: '#111827',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  );
}
