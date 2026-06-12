// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Periksa sesi otentikasi di tingkat server
  const { data: { user } } = await supabase.auth.getUser()

  // Jika tidak ada sesi aktif, tendang langsung ke login
  if (!user) {
    redirect('/login')
  }

  // Jika ada sesi aktif, cari peran akun untuk pengalihan dasbor yang akurat
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'DEPT_HEAD') {
    redirect('/dept-head/dashboard')
  } else {
    redirect('/leader/dashboard')
  }

  // Komponen kontrol rute server tidak membutuhkan render elemen HTML visual
  return null
}