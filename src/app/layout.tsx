import type { Metadata } from 'next'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Suara Kampus — Pusat Aspirasi Sivitas Akademika',
  description:
    'Portal resmi untuk menyampaikan, memahami, dan menindaklanjuti suara sivitas akademika berbasis data.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-[#08111f] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-white bg-ambient">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
