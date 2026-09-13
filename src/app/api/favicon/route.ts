import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const API_LOGO_URL =
  'https://l9qhf677-3000.asse.devtunnels.ms/api/v1/logo/logo-stb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(API_LOGO_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'image/png,image/*;q=0.9,*/*;q=0.8',
      },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      })
    }
  } catch (error) {
    console.warn('Gagal mengambil favicon dari remote API, menggunakan fallback lokal:', error)
  }

  // Fallback ke file icon lokal jika tunnel/API tidak merespons
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'icon.png'),
      path.join(process.cwd(), 'src', 'app', 'icon.png'),
    ]
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const fileBuffer = fs.readFileSync(p)
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        })
      }
    }
  } catch (err) {
    console.error('Fallback icon error:', err)
  }

  return new NextResponse('Icon not found', { status: 404 })
}
