// src/app/dept-head/laporan/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Send, CalendarRange } from 'lucide-react'

export default function LaporanPage() {
  // Set default ke hari ini
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  // Logika pembatasan: Jika tanggal awal dan akhir berbeda, PDF didisable
  const isMultiDay = startDate !== endDate

  const handleDownloadPDF = () => {
    alert('Fitur Generate PDF akan kita kerjakan besok setelah template siap!')
  }

  const handleDownloadExcel = () => {
    alert(`Mengekspor data Excel dari ${startDate} sampai ${endDate}... (Akan diimplementasikan)`)
  }

  const handleForwardWA = () => {
    alert(`Menyiapkan Ringkasan Eksekutif untuk WhatsApp dari ${startDate} sampai ${endDate}... (Akan diimplementasikan)`)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pusat Unduh Laporan</h1>
        <p className="text-slate-500 text-sm mt-1">Tarik data rekapitulasi produksi berdasarkan rentang waktu tertentu.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filter Rentang Waktu</CardTitle>
          </div>
          <CardDescription>
            Pilih tanggal awal dan akhir laporan. Laporan format cetak pabrik (PDF) hanya tersedia untuk penarikan data 1 hari (Harian).
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* INPUT TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Dari Tanggal</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="py-6 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Sampai Tanggal</Label>
              <Input 
                type="date" 
                value={endDate} 
                min={startDate} // Mencegah tanggal akhir lebih mundur dari tanggal awal
                onChange={(e) => setEndDate(e.target.value)} 
                className="py-6 text-lg"
              />
            </div>
          </div>

          {/* TOMBOL AKSI EKSPOR */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <Button 
              onClick={handleDownloadPDF}
              disabled={isMultiDay}
              className={`h-auto py-4 flex flex-col items-center gap-2 transition-all ${
                isMultiDay ? 'bg-slate-100 text-slate-400' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
              }`}
            >
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <span className="block font-bold">Cetak PDF Pabrik</span>
                <span className="block text-xs font-normal opacity-80 mt-1">
                  {isMultiDay ? 'Khusus Laporan 1 Hari' : 'Format Sesuai Standar Cetak'}
                </span>
              </div>
            </Button>

            <Button 
              onClick={handleDownloadExcel}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
            >
              <FileSpreadsheet className="w-6 h-6" />
              <div className="text-center">
                <span className="block font-bold">Ekspor ke Excel</span>
                <span className="block text-xs font-normal opacity-90 mt-1">Data Tabel Raw (.xlsx)</span>
              </div>
            </Button>

            <Button 
              onClick={handleForwardWA}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-green-500 hover:bg-green-600 text-white shadow-md transition-all"
            >
              <Send className="w-6 h-6" />
              <div className="text-center">
                <span className="block font-bold">Forward WhatsApp</span>
                <span className="block text-xs font-normal opacity-90 mt-1">Kirim Ringkasan Eksekutif</span>
              </div>
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}