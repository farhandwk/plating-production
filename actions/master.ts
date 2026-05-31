// src/actions/master.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MasterActionState = {
  error: string;
  success?: string;
}

export async function addPart(prevState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  const supabase = await createClient()
  
  const part_name = formData.get('part_name') as string
  const part_type = formData.get('part_type') as string
  const part_number = formData.get('part_number') as string

  if (!part_name || !part_type || !part_number) {
    return { error: 'Semua kolom (Kategori, Spesifikasi, Nomor) wajib diisi.' }
  }

  // Insert ke database dan ubah teks menjadi HURUF KAPITAL agar seragam
  const { error } = await supabase.from('master_parts').insert({
    part_name: part_name.toUpperCase(),
    part_type: part_type.toUpperCase(),
    part_number: part_number.toUpperCase()
  })

  if (error) {
    console.error('Error insert part:', error.message)
    // Biasanya error terjadi karena constraint UNIQUE pada part_number
    return { error: 'Gagal menyimpan. Pastikan Part Number belum pernah terdaftar sebelumnya.' }
  }

  // Segarkan halaman ini dan halaman dasbor leader agar pilihan dropdown ter-update
  revalidatePath('/dept-head/master-data')
  revalidatePath('/leader/dashboard')
  
  return { error: '', success: 'Material Part baru berhasil ditambahkan!' }
}

export async function deletePart(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('master_parts').delete().eq('id', id)
  
  if (error) {
    console.error('Error delete part:', error.message)
    return { error: 'Gagal menghapus. Material ini mungkin sudah memiliki riwayat produksi dan tidak bisa dihapus.' }
  }

  revalidatePath('/dept-head/master-data')
  revalidatePath('/leader/dashboard')
  return { success: 'Material berhasil dihapus.' }
}


export async function editPart(prevState: MasterActionState, formData: FormData): Promise<MasterActionState> {
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const part_name = formData.get('part_name') as string
  const part_type = formData.get('part_type') as string
  const part_number = formData.get('part_number') as string

  if (!id || !part_name || !part_type || !part_number) {
    return { error: 'Semua kolom (Kategori, Spesifikasi, Nomor) wajib diisi.' }
  }

  // Update data di database
  const { error } = await supabase
    .from('master_parts')
    .update({
      part_name: part_name.toUpperCase(),
      part_type: part_type.toUpperCase(),
      part_number: part_number.toUpperCase()
    })
    .eq('id', id)

  if (error) {
    console.error('Error update part:', error.message)
    return { error: 'Gagal memperbarui. Pastikan Part Number tidak duplikat dengan yang lain.' }
  }

  revalidatePath('/dept-head/master-data')
  revalidatePath('/leader/dashboard')
  
  return { error: '', success: 'Data material berhasil diperbarui!' }
}