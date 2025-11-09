import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flowbit AI - Analytics Dashboard',
  description: 'Production-grade analytics dashboard with AI-powered data insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
