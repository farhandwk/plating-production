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
  
  // 1. Validasi Sesi Pengguna
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi Anda telah berakhir. Silakan login kembali.' }

  const date = formData.get('date') as string
  const shift = parseInt(formData.get('shift') as string)

  // Ambil seluruh array dinamis dari form komponen
  const partIds = formData.getAll('part_id') as string[]
  const qtysIn = formData.getAll('qty_in') as string[]
  const qtysOutOk = formData.getAll('qty_out_ok') as string[]
  const qtysOutNg = formData.getAll('qty_out_ng') as string[]
  const operatorNames = formData.getAll('operator_name') as string[]

  if (!partIds.length || !date || !shift) {
    return { error: 'Data Part, Tanggal, dan Shift wajib diisi.' }
  }

  // Array penampung payload akhir untuk dikirim ke RPC Supabase
  const payload: any[] = []

  // 2. LOGIKA PILAH DATA MANDIRI (INTELLIGENT SPLIT)
  for (let index = 0; index < partIds.length; index++) {
    const part_id = partIds[index]
    if (!part_id) continue // Lewati jika baris material kosong

    const qtyIn = qtysIn[index] ? parseInt(qtysIn[index]) : 0
    const qtyOutOk = qtysOutOk[index] ? parseInt(qtysOutOk[index]) : 0
    const qtyOutNg = qtysOutNg[index] ? parseInt(qtysOutNg[index]) : 0
    const targetOperatorName = operatorNames[index] ? (operatorNames[index] as string).trim() : ''

    // Skenario A: Jika baris ini mengisi data Material Masuk (IN)
    if (qtyIn > 0) {
      payload.push({
        part_id,
        date,
        shift,
        form_type: 'IN', // Dikunci sebagai IN agar database tidak memicu hitungan/kunci produksi harian
        leader_id: user.id,
        qty_in: qtyIn,
        qty_out_ok: 0,
        qty_out_ng: 0,
        operator_name: '' // Logistik masuk tidak memerlukan nama operator mesin
      })
    }

    // Skenario B: Jika baris ini mengisi data Hasil Laporan Produksi (OUT)
    if (qtyOutOk > 0 || qtyOutNg > 0) {
      // Validasi ketat nama operator HANYA berlaku jika ada hasil produksi keluar
      if (!targetOperatorName) {
        return { error: `Nama Operator pada Material #${index + 1} wajib diisi untuk pelaporan hasil produksi (OUT).` }
      }

      payload.push({
        part_id,
        date,
        shift,
        form_type: 'OUT', // Ditandai sebagai OUT agar database memproses akumulasi performa & defect rate
        leader_id: user.id,
        qty_in: 0,
        qty_out_ok: qtyOutOk,
        qty_out_ng: qtyOutNg,
        operator_name: targetOperatorName
      })
    }
  }

  // Jika setelah diperiksa ternyata form kosong semua (hanya isi angka 0)
  if (payload.length === 0) {
    return { error: 'Silakan isi jumlah kuantitas kuantitatif (IN/OK/NG) sebelum menyimpan data.' }
  }

  try {
    // 3. TEMBAKKAN DATA KE DATABASE SECARA ATOMIK (1x Jaringan)
    const { error } = await supabase.rpc('process_stock_batch', { payload })

    if (error) {
      console.error('RPC Error:', error.message)
      return { error: 'Gagal merekam data ke database. Hubungi administrator.' }
    }

    revalidatePath('/leader/dashboard')
    return { error: '', success: `Berhasil memproses dan merekam ${payload.length} log pergerakan material (IN/OUT) secara atomik!` }
    
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem internal.' }
  }
}