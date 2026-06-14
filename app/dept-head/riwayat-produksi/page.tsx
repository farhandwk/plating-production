'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import * as XLSX from 'xlsx' // 👉 IMPORT LIBRARY EXCEL

type LogEntry = {
  id: string
  date: string
  shift: number
  qty_in: number
  qty_out_ok: number
  qty_out_ng: number
  operator_name: string
  master_parts: { part_name: string; part_number: string; part_type: string }
  leader: { alias_name: string; full_name: string }
}

export default function ProductionHistoryPage() {
  const supabase = createClient()
  
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 15 

  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  const [filterShift, setFilterShift] = useState<string>('ALL')
  const [searchPart, setSearchPart] = useState<string>('')

  // Fungsi Fetch untuk Tabel (dengan Paginasi)
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('production_logs')
      .select(`
        id, date, shift, qty_in, qty_out_ok, qty_out_ng, operator_name,
        master_parts!inner(part_name, part_number, part_type),
        leader:users!production_logs_leader_id_fkey(alias_name, full_name)
      `, { count: 'exact' })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (filterShift && filterShift !== 'ALL') query = query.eq('shift', filterShift)
    
    if (searchPart) {
      query = query.or(
        `part_name.ilike.%${searchPart}%,part_number.ilike.%${searchPart}%,part_type.ilike.%${searchPart}%`, 
        { foreignTable: 'master_parts' }
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query
      .order('date', { ascending: false })
      .order('shift', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching logs:', error)
    } else {
      const formattedData = (data as any[]).map(item => ({
        ...item,
        master_parts: Array.isArray(item.master_parts) ? item.master_parts[0] : item.master_parts,
        leader: Array.isArray(item.leader) ? item.leader[0] : item.leader
      }))
      setLogs(formattedData)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [supabase, startDate, endDate, filterShift, searchPart, page, pageSize])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPage(1) }, [startDate, endDate, filterShift, searchPart])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Validasi Kelayakan Unduh (Untuk Format Laporan 1 Hari)
  const isValidSingleDay = (startDate && endDate && startDate === endDate) || (startDate && !endDate) || (!startDate && endDate);
  const targetDownloadDate = startDate || endDate;

  // ====================================================================
  // EKSEKUSI 1: UNDUH PDF
  // ====================================================================
  const handleDownloadPDF = () => {
    if (!isValidSingleDay) {
      alert("⚠️ GAGAL MENGUNDUH\n\nLaporan PDF berformat HARIAN. Silakan atur rentang waktu menjadi 1 hari.")
      return
    }
    window.open(`/api/export/pdf-harian?date=${targetDownloadDate}`, '_blank')
  }

  // ====================================================================
  // EKSEKUSI 2: GENERATE & DOWNLOAD EXCEL (Bisa Semua Hari)
  // ====================================================================
  const handleDownloadExcel = async () => {
    try {
      // Tombol ini tidak pakai paginasi, kita tarik SEMUA data yang sesuai filter saat ini
      let query = supabase
        .from('production_logs')
        .select(`
          date, shift, qty_in, qty_out_ok, qty_out_ng, operator_name,
          master_parts!inner(part_name, part_number, part_type),
          leader:users!production_logs_leader_id_fkey(alias_name, full_name)
        `)

      if (startDate) query = query.gte('date', startDate)
      if (endDate) query = query.lte('date', endDate)
      if (filterShift && filterShift !== 'ALL') query = query.eq('shift', filterShift)
      if (searchPart) {
        query = query.or(
          `part_name.ilike.%${searchPart}%,part_number.ilike.%${searchPart}%,part_type.ilike.%${searchPart}%`, 
          { foreignTable: 'master_parts' }
        )
      }

      query = query.order('date', { ascending: false }).order('shift', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      if (!data || data.length === 0) {
        alert("Tidak ada data untuk diekspor.")
        return
      }

      // Format data mentah menjadi baris dan kolom rapi (Mapping)
      const excelData = data.map((log: any, index: number) => {
        const part = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts;
        const leaderInfo = Array.isArray(log.leader) ? log.leader[0] : log.leader;
        return {
          'No': index + 1,
          'Tanggal': log.date,
          'Shift': `Shift ${log.shift}`,
          'Kode Part': part?.part_number || '-',
          'Nama Part': part?.part_name || '-',
          'Tipe': part?.part_type || '-',
          'IN': log.qty_in || 0,
          'OK': log.qty_out_ok || 0,
          'NG': log.qty_out_ng || 0,
          'Sisa': (log.qty_in || 0) - (log.qty_out_ok || 0) - (log.qty_out_ng || 0),
          'Operator': log.operator_name || '-',
          'Leader': leaderInfo?.alias_name || leaderInfo?.full_name || '-'
        }
      })

      // Buat Worksheet & Workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produksi')

      // Unduh File
      const fileName = `Laporan_Produksi_${startDate || 'Semua'}_sd_${endDate || 'Semua'}.xlsx`
      XLSX.writeFile(workbook, fileName)

    } catch (err: any) {
      alert("Gagal mengunduh Excel: " + err.message)
    }
  }

  // ====================================================================
  // EKSEKUSI 3: GENERATE RINGKASAN & FORWARD KE WHATSAPP
  // ====================================================================
  const handleForwardWhatsApp = async () => {
    if (!isValidSingleDay) {
      alert("⚠️ GAGAL MENERUSKAN\n\nRingkasan WA berformat Laporan Harian. Silakan atur rentang waktu menjadi tepat 1 hari saja.")
      return
    }

    try {
      // Tarik ulang semua data HARI TERSEBUT (karena data di state mungkin terpotong paginasi)
      const { data, error } = await supabase
        .from('production_logs')
        .select(`
          shift, qty_in, qty_out_ok, qty_out_ng,
          master_parts!inner(part_name, part_number)
        `)
        .eq('date', targetDownloadDate)
        .order('shift', { ascending: true })

      if (error) throw error
      if (!data || data.length === 0) {
        alert("Tidak ada data produksi pada tanggal tersebut.")
        return
      }

      // Susun string pesan
      let waText = `*LAPORAN PRODUKSI HARIAN PLATING*\n`
      waText += `Tanggal: ${targetDownloadDate}\n\n`

      const shifts = [1, 2, 3]
      shifts.forEach(shiftNum => {
        const shiftData = data.filter(d => d.shift === shiftNum)
        if (shiftData.length > 0) {
          waText += `*SHIFT ${shiftNum}*\n`
          shiftData.forEach(log => {
            const part = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts
            const isInputMode = log.qty_in > 0;
            
            if (isInputMode) {
              waText += `• ${part?.part_name}: IN ${log.qty_in}\n`
            } else {
              waText += `• ${part?.part_name}: OK ${log.qty_out_ok} | NG ${log.qty_out_ng}\n`
            }
          })
          waText += `\n`
        }
      })

      waText += `_Di-generate otomatis dari Sistem Plating MMP_`

      // Encode URL lalu lemparkan ke API WhatsApp Forwarder
      const encodedText = encodeURIComponent(waText)
      const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`
      window.open(waUrl, '_blank')

    } catch (err: any) {
      alert("Gagal membuat ringkasan WA: " + err.message)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* HEADER & ACTION BUTTONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Produksi</h1>
          <p className="text-slate-500 text-sm">Pantau riwayat lengkap produksi atau saring data menggunakan rentang waktu.</p>
        </div>
        
        {/* GRUP TOMBOL EKSPOR & SHARE */}
        <div className="flex flex-wrap items-center gap-2 mt-2 xl:mt-0">
          <Button 
            onClick={handleForwardWhatsApp} 
            variant={isValidSingleDay ? "default" : "outline"}
            className={isValidSingleDay ? "bg-[#25D366] hover:bg-[#1ebd57] text-white font-bold shadow-sm" : "text-slate-400"}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            WA {isValidSingleDay ? `(${targetDownloadDate})` : ''}
          </Button>

          <Button 
            onClick={handleDownloadExcel} 
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Excel (Sesuai Filter)
          </Button>

          <Button 
            onClick={handleDownloadPDF} 
            variant={isValidSingleDay ? "default" : "outline"}
            className={isValidSingleDay ? "bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm" : "text-slate-400"}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            PDF {isValidSingleDay ? `(${targetDownloadDate})` : '(Harus 1 Hari)'}
          </Button>
        </div>
      </div>

      {/* FILTER & TABEL */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg">Filter Pencarian</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <Label>Mulai Tanggal</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Sampai Tanggal</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-white"
                min={startDate} 
              />
            </div>
            <div className="space-y-1">
              <Label>Shift</Label>
              <Select value={filterShift} onValueChange={setFilterShift}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Semua Shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Shift</SelectItem>
                  <SelectItem value="1">Shift 1</SelectItem>
                  <SelectItem value="2">Shift 2</SelectItem>
                  <SelectItem value="3">Shift 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cari Material</Label>
              <Input 
                type="text" 
                placeholder="Kode, Nama, atau Tipe..." 
                value={searchPart} 
                onChange={(e) => setSearchPart(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Tanggal & Shift</th>
                  <th className="px-6 py-4 font-bold">Material (Kode & Tipe)</th>
                  <th className="px-6 py-4 font-bold text-center text-blue-600">IN</th>
                  <th className="px-6 py-4 font-bold text-center text-emerald-600">OK</th>
                  <th className="px-6 py-4 font-bold text-center text-red-600">NG</th>
                  <th className="px-6 py-4 font-bold">Operator</th>
                  <th className="px-6 py-4 font-bold">Leader</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 animate-pulse">
                      Memuat data riwayat...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      Tidak ada data yang ditemukan pada rentang waktu ini.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.date}</div>
                        <div className="text-xs text-slate-500">Shift {log.shift}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800">{log.master_parts?.part_name}</div>
                        <div className="text-xs text-slate-500">
                          {log.master_parts?.part_number} • {log.master_parts?.part_type}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{log.qty_in || '-'}</td>
                      <td className="px-6 py-3 text-center font-bold text-emerald-600 bg-emerald-50/30">{log.qty_out_ok || '-'}</td>
                      <td className="px-6 py-3 text-center font-bold text-red-600 bg-red-50/30">{log.qty_out_ng || '-'}</td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                          {log.operator_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-medium">
                        {log.leader?.alias_name || log.leader?.full_name?.split(' ')[0] || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
              <span className="text-sm text-slate-600">
                Menampilkan <span className="font-bold">{(page - 1) * pageSize + 1}</span> hingga <span className="font-bold">{Math.min(page * pageSize, totalCount)}</span> dari <span className="font-bold">{totalCount}</span> baris riwayat
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}