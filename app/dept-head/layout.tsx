// src/app/dept-head/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import { ShieldCheck, LogOut } from 'lucide-react'

// Impor komponen navigasi klien yang baru dibuat
import DeptHeadNav from '@/components/layout/DeptHeadNav'

export default async function DeptHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* SIDEBAR (Desktop) / TOPBAR (Mobile) */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col md:min-h-screen sticky top-0 z-20 shadow-xl">
        
        {/* Logo & Branding */}
        <div className="h-16 md:h-20 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">Plating Admin</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Control Tower</p>
            </div>
          </div>
        </div>

        {/* Profil Pengguna Singkat */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 hidden md:block">
          <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <p className="text-xs text-emerald-400 font-medium">{profile?.role}</p>
          </div>
        </div>

        {/* Komponen Navigasi Dinamis */}
        <DeptHeadNav />

        {/* Tombol Logout */}
        <div className="p-4 hidden md:block border-t border-slate-800">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Keluar Sistem</span>
            </button>
          </form>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-full overflow-hidden">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  )
}