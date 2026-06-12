// src/proxy.ts
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

  const url = request.nextUrl.clone()
  const isProtectedPath = url.pathname.startsWith('/dept-head') || url.pathname.startsWith('/leader')

  let user = null

  // 👉 PROTEKSI: Bungkus dalam try-catch agar jika token korup/not found, tidak nge-crash/looping
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.warn("Sesi token kedaluwarsa atau tidak valid, membersihkan rute.")
    user = null
  }

  // Jika BELUM login atau token bermasalah, arahkan ke /login
  if (!user) {
    if (isProtectedPath || url.pathname === '/') {
      url.pathname = '/login'
      
      // Amankan pembersihan jika ada sisa cookie rusak yang menggantung
      const clearResponse = NextResponse.redirect(url)
      clearResponse.cookies.delete('sb-access-token')
      clearResponse.cookies.delete('sb-refresh-token')
      return clearResponse
    }
  }

  // Verifikasi Role jika User Valid
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (url.pathname.startsWith('/dept-head') && role !== 'DEPT_HEAD') {
      url.pathname = '/leader/dashboard'
      return NextResponse.redirect(url)
    }

    if (url.pathname === '/login' || url.pathname === '/') {
      if (role === 'DEPT_HEAD') {
        url.pathname = '/dept-head/dashboard'
      } else {
        url.pathname = '/leader/dashboard'
      }
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}