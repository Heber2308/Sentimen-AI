import type { Metadata } from 'next'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Sentimen AI — Sistem Analisis Sentimen Aspirasi Realtime',
  description:
    'Aplikasi analisis sentimen berbasis Machine Learning & NLP dengan pembaruan data realtime Supabase.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#050816] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-500 selection:text-white bg-ambient">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
