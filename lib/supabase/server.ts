import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// REVISI NEXT.JS 15: Tambahkan 'async' di sini
export async function createClient() {
  // REVISI NEXT.JS 15: Tambahkan 'await' di sini
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Error ini wajar jika dipanggil dari Server Component (Runtime).
            // Middleware akan menangani pembaruan sesi yang sesungguhnya.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Error ini wajar jika dipanggil dari Server Component (Runtime).
          }
        },
      },
    }
  )
}