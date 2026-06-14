// src/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type ActionState = {
  error: string;
  success?: string; 
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient() 
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email atau password yang Anda masukkan salah.' }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function registerUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  // 1. Tarik Data Form (Tanpa emp_username)
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const rawAliasName = formData.get('alias_name') as string | null

  // Validasi Keterisian
  if (!email || !password || !fullName || !role) {
    return { error: 'Semua kolom bertanda bintang (*) wajib diisi.' }
  }

  if (password.length < 6) {
    return { error: 'Password terlalu pendek (Minimal 6 karakter).' }
  }

  // Otomatisasi Alias Name (Jika kosong, ambil kata pertama dari Full Name)
  const finalAliasName = (rawAliasName && rawAliasName.trim() !== '') 
    ? rawAliasName.trim() 
    : fullName.trim().split(' ')[0]

  try {
    // 2. DAFTARKAN KE SUPABASE AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { error: 'Email ini sudah terdaftar di sistem.' }
      }
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Sistem menolak pembuatan akun. Coba beberapa saat lagi.' }
    }

    // 3. DAFTARKAN PROFIL KE TABEL PUBLIC.USERS (Tanpa kolom username)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        alias_name: finalAliasName,
        role: role,
        is_active: true
      })

    if (profileError) {
      console.error('Gagal membuat profil:', profileError.message)
      return { error: 'Terjadi kegagalan sinkronisasi profil. Hubungi Administrator.' }
    }

    return { error: '', success: 'Registrasi berhasil! Akun Anda telah aktif.' }

  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem internal: ' + err.message }
  }
}