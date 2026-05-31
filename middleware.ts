import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Dapatkan Sesi Pengguna Saat Ini
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // 2. Blokir Akses Halaman Terproteksi Jika Belum Login
  const isProtectedPath = url.pathname.startsWith('/dept-head') || url.pathname.startsWith('/leader')
  
  if (!user && isProtectedPath) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Verifikasi Role untuk Pengguna yang Sudah Login
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Proteksi Jalur Dept Head
    if (url.pathname.startsWith('/dept-head') && role !== 'DEPT_HEAD') {
      url.pathname = '/leader/dashboard' // Tendang kembali ke area Leader
      return NextResponse.redirect(url)
    }

    // Navigasi Otomatis dari Root (/) atau Halaman Login
    if (url.pathname === '/login' || url.pathname === '/') {
      if (role === 'DEPT_HEAD') {
        url.pathname = '/dept-head/dashboard'
      } else if (role === 'LEADER' || role === 'QUALITY_CONTROL') {
        url.pathname = '/leader/dashboard'
      }
      return NextResponse.redirect(url)
    }
  }

  return response
}

// Tentukan rute mana saja yang harus dilewati middleware ini
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}