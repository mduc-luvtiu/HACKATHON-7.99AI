import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multimedia Supporter',
  description: 'Created by 7.99AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
