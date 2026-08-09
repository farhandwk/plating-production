// src/components/layout/DeptHeadNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Database, History, Users, ChartNoAxesCombined } from 'lucide-react'

export default function DeptHeadNav() {
  // Hook ini akan selalu mendeteksi URL aktif saat ini
  const pathname = usePathname()

  // Daftar menu untuk mempermudah perulangan (mapping)
  const navItems = [
    { name: 'Monitoring Matriks', href: '/dept-head/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/dept-head/analytics', icon: ChartNoAxesCombined },
    { name: 'Master Data', href: '/dept-head/master-data', icon: Database },
    { name: 'Riwayat Produksi', href: '/dept-head/riwayat-produksi', icon: History },
    { name: 'Kelola Pengguna', href: '/dept-head/users', icon: Users },
  ]

  return (
    <nav className="flex-1 px-4 py-4 md:py-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
      {navItems.map((item) => {
        const Icon = item.icon
        // Cek apakah URL saat ini sama dengan href milik menu
        const isActive = pathname === item.href

        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors whitespace-nowrap ${
              isActive 
                ? 'bg-blue-600/10 text-blue-400 font-medium' // Warna saat aktif
                : 'text-slate-400 hover:bg-slate-800 hover:text-white' // Warna saat tidak aktif
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}