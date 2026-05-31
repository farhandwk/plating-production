// src/app/leader/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Ambil data user yang sedang login
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ambil nama lengkap dan role dari tabel public.users
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header / Top Navigation Bar */}
      <header className="bg-white border-b border-slate-300 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Bagian Kiri: Identitas Aplikasi */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="font-bold text-slate-800 text-lg hidden sm:block">
                  Plating Production
                </span>
              </div>
            </div>

            {/* Bagian Kanan: Identitas User & Tombol Keluar */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{profile?.full_name}</p>
                <p className="text-xs text-emerald-600 font-medium">{profile?.role}</p>
              </div>
              
              <div className="h-8 w-px bg-slate-300 mx-1"></div>
              
              <form action={logout}>
                <button 
                  type="submit" 
                  className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  Keluar
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </header>

      {/* Konten Utama (Berisi Dasbor Input Stok) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}