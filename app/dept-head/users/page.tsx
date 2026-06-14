// src/app/dept-head/users/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleUserStatus, updateUserRole } from '@/actions/user-management'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

type UserProfile = {
  id: string
  full_name: string
  alias_name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function UserManagementPage() {
  const supabase = createClient()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('id, full_name, alias_name, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,alias_name.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }, [supabase, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handler untuk mengubah status aktif/nonaktif
  const handleToggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const confirmMsg = currentStatus 
      ? `Nonaktifkan akses untuk ${userName}? Ia tidak akan bisa login lagi.`
      : `Aktifkan kembali akses untuk ${userName}?`
      
    if (!confirm(confirmMsg)) return

    const res = await toggleUserStatus(userId, currentStatus)
    if (res.error) {
      alert("Gagal mengubah status: " + res.error)
    } else {
      fetchUsers() // Refresh tabel setelah sukses
    }
  }

  // Handler untuk mengubah Role/Jabatan
  const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
    if (!confirm(`Ubah jabatan ${userName} menjadi ${newRole.replace('_', ' ')}?`)) return
    
    const res = await updateUserRole(userId, newRole)
    if (res.error) {
      alert("Gagal mengubah jabatan: " + res.error)
    } else {
      fetchUsers()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm">Kelola akses, jabatan, dan status keaktifan karyawan dalam sistem.</p>
        </div>
        
        <Link href="/register">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Tambah Pengguna Baru
          </Button>
        </Link>
      </div>

      {/* Kontainer Tabel */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Daftar Karyawan Terdaftar</CardTitle>
          <div className="w-full md:w-72">
            <Input 
              type="text" 
              placeholder="Cari nama karyawan..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Informasi Profil</th>
                  <th className="px-6 py-4 font-bold">Jabatan (Role)</th>
                  <th className="px-6 py-4 font-bold text-center">Status Akses</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi / Kendali</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 animate-pulse">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      Tidak ada karyawan yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                      {/* Kolom Profil */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-base">{user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border">
                            Alias: {user.alias_name}
                          </span>
                          <span>Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </td>

                      {/* Kolom Dropdown Role */}
                      <td className="px-6 py-4">
                        <Select 
                          defaultValue={user.role} 
                          onValueChange={(val) => handleChangeRole(user.id, val, user.full_name)}
                        >
                          <SelectTrigger className={`w-40 font-semibold ${user.role === 'DEPT_HEAD' ? 'text-indigo-600' : 'text-slate-700'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEADER">Leader Produksi</SelectItem>
                            <SelectItem value="QUALITY_CONTROL">Quality Control</SelectItem>
                            <SelectItem value="DEPT_HEAD">Department Head</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Kolom Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          user.is_active 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant={user.is_active ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.is_active, user.full_name)}
                          className={!user.is_active ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" : ""}
                        >
                          {user.is_active ? 'Cabut Akses' : 'Pulihkan Akses'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}