// src/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// 1. Definisikan tipe data state secara eksplisit
export type ActionState = {
  error: string;
}

// 2. Terapkan tipe data tersebut ke prevState dan return function
export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient() 
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Return harus persis berformat { error: string } sesuai ActionState
    return { error: 'Email atau password yang Anda masukkan salah.' }
  }

  // Jika sukses, lempar pengguna ke root URL
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}