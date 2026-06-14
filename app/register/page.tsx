// src/app/register/page.tsx
'use client'

import { useActionState, useEffect, useRef } from 'react'
import { registerUser, type ActionState } from '@/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const initialState: ActionState = { error: '' }

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      const timer = setTimeout(() => {
        router.push('/login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state.success, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center bg-white rounded-t-xl">
          <CardTitle className="text-2xl font-bold text-slate-800">Daftar Akun Baru</CardTitle>
          <CardDescription className="text-slate-500">
            Sistem Informasi Produksi & Plating PT. MMP
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 bg-white">
          {state.error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm text-center">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-sm font-semibold text-center">
              {state.success} <br/> Mengalihkan ke halaman login...
            </div>
          )}

          <form ref={formRef} action={formAction} className="space-y-4">
            
            {/* GRUP KREDENSIAL */}
            <div className="space-y-4 p-4 rounded-lg bg-slate-50/50 border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kredensial Login</h3>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="nama@perusahaan.com" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password Sistem *</Label>
                <Input id="password" name="password" type="password" required placeholder="Minimal 6 Karakter" className="bg-white" />
              </div>
            </div>

            {/* GRUP DATA PROFIL */}
            <div className="space-y-4 p-4 rounded-lg bg-slate-50/50 border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profil Karyawan</h3>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input id="full_name" name="full_name" type="text" required placeholder="Sesuai KTP / ID Card" className="bg-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias_name">Nama Panggilan (Alias) Laporan</Label>
                <Input id="alias_name" name="alias_name" type="text" placeholder="Opsional (Kosongkan = Ambil nama depan)" className="bg-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Jabatan / Role *</Label>
                <Select name="role" required defaultValue="LEADER">
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEADER">Leader Produksi</SelectItem>
                    <SelectItem value="DEPT_HEAD">Department Head</SelectItem>
                    <SelectItem value="QUALITY_CONTROL">Quality Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isPending || !!state.success} 
              className="w-full py-6 mt-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              {isPending ? 'MEMPROSES PENDAFTARAN...' : 'DAFTARKAN AKUN'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center bg-white pb-6 rounded-b-xl">
          <p className="text-sm text-slate-500">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}