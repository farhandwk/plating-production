// src/actions/stock.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type StockActionState = {
  error: string;
  success?: string;
}

export async function submitStockLog(prevState: StockActionState, formData: FormData): Promise<StockActionState> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi Anda telah berakhir. Silakan login kembali.' }

  // 1. Ambil Data Global (Berlaku untuk semua material dalam satu batch)
  const date = formData.get('date') as string
  const shift = parseInt(formData.get('shift') as string)
  const formType = formData.get('form_type') as string 
  
  // 2. Ambil Data Array (Bisa berisi lebih dari 1 material)
  const partIds = formData.getAll('part_id') as string[]
  const qtysIn = formData.getAll('qty_in') as string[]
  const qtysOutOk = formData.getAll('qty_out_ok') as string[]
  const qtysOutNg = formData.getAll('qty_out_ng') as string[]

  if (!partIds.length || !date || !shift) {
    return { error: 'Data Part, Tanggal, dan Shift wajib diisi minimal 1.' }
  }

  // 3. Proses UPSERT satu per satu ke Database
  for (let i = 0; i < partIds.length; i++) {
    const part_id = partIds[i]
    if (!part_id) continue; // Lewati jika ada baris kosong

    const { data: existingLog } = await supabase
      .from('production_logs')
      .select('*')
      .eq('date', date)
      .eq('shift', shift)
      .eq('part_id', part_id)
      .single()

    let stock_awal = 0;

    if (!existingLog) {
      const { data: previousLog } = await supabase
        .from('production_logs')
        .select('sisa')
        .eq('part_id', part_id)
        .order('date', { ascending: false })
        .order('shift', { ascending: false })
        .limit(1)
        .single()
      
      stock_awal = previousLog?.sisa || 0 
    } else {
      stock_awal = existingLog.stock_awal 
    }

    // ... [kode sebelumnya di dalam for loop tetap sama]

    // Ekstrak angka dari array berdasarkan index, fallback ke 0 jika kosong
    const inputQtyIn = qtysIn[i] ? parseInt(qtysIn[i]) : 0;
    const inputQtyOutOk = qtysOutOk[i] ? parseInt(qtysOutOk[i]) : 0;
    const inputQtyOutNg = qtysOutNg[i] ? parseInt(qtysOutNg[i]) : 0;

    // LOGIKA PENJUMLAHAN AKUMULATIF (MENGURANGI BEBAN KOGNITIF LEADER)
    // Jika data sudah ada, sistem akan menjumlahkan nilai lama dengan input baru.
    // Jika belum ada (undefined), sistem akan menganggap nilai lama adalah 0.
    const accumulatedQtyIn = formType === 'IN' 
      ? (existingLog?.qty_in || 0) + inputQtyIn 
      : (existingLog?.qty_in || 0);

    const accumulatedQtyOutOk = formType === 'OUT' 
      ? (existingLog?.qty_out_ok || 0) + inputQtyOutOk 
      : (existingLog?.qty_out_ok || 0);

    const accumulatedQtyOutNg = formType === 'OUT' 
      ? (existingLog?.qty_out_ng || 0) + inputQtyOutNg 
      : (existingLog?.qty_out_ng || 0);

    const payload = {
      part_id,
      date,
      shift,
      stock_awal,
      target: 0, 
      qty_in: accumulatedQtyIn,
      qty_out_ok: accumulatedQtyOutOk,
      qty_out_ng: accumulatedQtyOutNg,
      leader_id: user.id
    }

    const { error } = await supabase
      .from('production_logs')
      .upsert(payload, { onConflict: 'date,shift,part_id' })

    if (error) {
      console.error(`Error upsert stock for part ${part_id}:`, error.message)
      return { error: `Gagal menyimpan material ke-${i + 1}. Proses dihentikan.` }
    }
  } // <-- Penutup for loop

  revalidatePath('/leader/dashboard')
  return { error: '', success: `${partIds.length} Data Material ${formType} berhasil direkam (ditambahkan ke total shift)!` }
}