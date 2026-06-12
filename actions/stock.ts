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

  const date = formData.get('date') as string
  const shift = parseInt(formData.get('shift') as string)
  const formType = formData.get('form_type') as string 

  const partIds = formData.getAll('part_id') as string[]
  const qtysIn = formData.getAll('qty_in') as string[]
  const qtysOutOk = formData.getAll('qty_out_ok') as string[]
  const qtysOutNg = formData.getAll('qty_out_ng') as string[]
  const operatorNames = formData.getAll('operator_name') as string[]

  if (!partIds.length || !date || !shift) {
    return { error: 'Data Part, Tanggal, dan Shift wajib diisi.' }
  }

  // 1. KEMAS DATA MENJADI ARRAY JSON
  const payload = partIds.map((part_id, index) => {
    const targetOperatorName = operatorNames[index] ? (operatorNames[index] as string).trim() : ''
    
    // Kembalikan error langsung jika validasi gagal
    if (formType === 'OUT' && !targetOperatorName) {
      throw new Error(`Nama Operator pada material ke-${index + 1} tidak boleh kosong.`)
    }

    return {
      part_id,
      date,
      shift,
      form_type: formType,
      leader_id: user.id,
      qty_in: qtysIn[index] ? parseInt(qtysIn[index]) : 0,
      qty_out_ok: qtysOutOk[index] ? parseInt(qtysOutOk[index]) : 0,
      qty_out_ng: qtysOutNg[index] ? parseInt(qtysOutNg[index]) : 0,
      operator_name: formType === 'OUT' ? targetOperatorName : ''
    }
  }).filter(item => item.part_id); // Abaikan baris material yang kosong

  try {
    // 2. TEMBAKKAN KE DATABASE (1x Panggilan Jaringan)
    const { error } = await supabase.rpc('process_stock_batch', { payload })

    if (error) {
      console.error('RPC Error:', error.message)
      return { error: 'Gagal merekam data ke database. Hubungi administrator.' }
    }

    revalidatePath('/leader/dashboard')
    return { error: '', success: `${payload.length} Data Material ${formType} berhasil dikalkulasi dan direkam secara atomik!` }
    
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem.' }
  }
}