// src/components/features/StockInputForm.tsx
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { submitStockLog, type StockActionState } from '@/actions/stock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type MasterPart = { id: string, part_name: string, part_type: string, part_number: string }

type FormEntry = {
  id: number
  category: string
  part_id: string
  qty_in: number
  qty_out_ok: number
  qty_out_ng: number
  operator_name: string
}

const initialState: StockActionState = { error: '' }

export default function StockInputForm({ masterParts }: { masterParts: MasterPart[] }) {
  const [state, formAction, isPending] = useActionState(submitStockLog, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN')
  
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [shift, setShift] = useState("1")

  // State untuk mengontrol tampilan alert sukses agar tidak merusak objek state utama
  const [successMessage, setSuccessMessage] = useState('')

  const createEmptyEntry = (): FormEntry => ({
    id: Date.now() + Math.random(),
    category: '',
    part_id: '',
    qty_in: 0,
    qty_out_ok: 0,
    qty_out_ng: 0,
    operator_name: ''
  })

  const [entries, setEntries] = useState<FormEntry[]>([createEmptyEntry()])
  const uniquePartNames = Array.from(new Set(masterParts.map(p => p.part_name))).sort()

  const handleAddEntry = () => {
    setEntries([...entries, createEmptyEntry()])
  }

  const handleRemoveEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id))
    }
  }

  // 👉 PERBAIKAN 1: Menggunakan functional updater (prev) agar kebal dari race condition batching
  const updateEntryField = (id: number, field: keyof FormEntry, value: any) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setEntries([createEmptyEntry()])
      setSuccessMessage(state.success)
      // Gunakan local state beralih, jangan memutasi variabel state bawaan useActionState langsung
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <Card className="w-full shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
        <CardTitle className="text-xl">Form Monitoring Stok</CardTitle>
        <CardDescription>
          Rekam material masuk dan laporan hasil produksi shift ini.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {state.error && <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">{state.error}</div>}
        {successMessage && <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-sm font-semibold">{successMessage}</div>}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'IN' | 'OUT')} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 h-auto min-h-[3.5rem] bg-slate-100">
            <TabsTrigger value="IN" className="h-full py-2 px-1 text-[11px] sm:text-sm font-semibold tracking-wide whitespace-normal text-center leading-tight">
              INPUT MATERIAL MASUK
            </TabsTrigger>
            <TabsTrigger value="OUT" className="h-full py-2 px-1 text-[11px] sm:text-sm font-semibold tracking-wide whitespace-normal text-center leading-tight">
              LAPOR HASIL PRODUKSI
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form ref={formRef} action={formAction} className="space-y-6">
          <input type="hidden" name="form_type" value={activeTab} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input 
                type="date" 
                name="date" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Shift Aktif</Label>
              <Select name="shift" value={shift} onValueChange={setShift} required>
                <SelectTrigger><SelectValue placeholder="Pilih Shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Shift 1</SelectItem>
                  <SelectItem value="2">Shift 2</SelectItem>
                  <SelectItem value="3">Shift 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* RENDER FORM DINAMIS (MATERIAL) */}
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const availableTypes = masterParts.filter(p => p.part_name === entry.category)
              
              return (
                <div key={entry.id} className="relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  
                  {/* Kebijakan Input Hidden agar data terekam utuh ke FormData Server Action */}
                  <input type="hidden" name="part_id" value={entry.part_id} />
                  <input type="hidden" name="qty_in" value={entry.qty_in} />
                  <input type="hidden" name="qty_out_ok" value={entry.qty_out_ok} />
                  <input type="hidden" name="qty_out_ng" value={entry.qty_out_ng} />
                  <input type="hidden" name="operator_name" value={entry.operator_name} />

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md text-xs tracking-wider">
                      MATERIAL #{index + 1}
                    </h3>
                    {entries.length > 1 && (
                      <button type="button" onClick={() => handleRemoveEntry(entry.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Kategori Part</Label>
                      {/* 👉 PERBAIKAN 2: Pembaruan Kategori & Reset Spesifikasi digabung atomis dalam satu fungsi setter */}
                      <Select required value={entry.category} onValueChange={(v) => {
                        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, category: v, part_id: '' } : e))
                      }}>
                        <SelectTrigger><SelectValue placeholder="-- Pilih Kategori --" /></SelectTrigger>
                        <SelectContent>
                          {uniquePartNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Spesifikasi Part</Label>
                      <Select required disabled={!entry.category} value={entry.part_id} onValueChange={(v) => updateEntryField(entry.id, 'part_id', v)}>
                        <SelectTrigger><SelectValue placeholder="-- Pilih Spesifikasi --" /></SelectTrigger>
                        <SelectContent>
                          {availableTypes.map(part => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.part_type} ({part.part_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* TAB PANEL 1: IN MATERIAL */}
                  <div className={cn("p-4 rounded-lg bg-blue-50/50 space-y-2", activeTab !== 'IN' && "hidden")}>
                    <Label className="text-blue-700 font-bold">MATERIAL MASUK (QTY IN)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="0" 
                      value={entry.qty_in === 0 ? '' : entry.qty_in}
                      onChange={(e) => updateEntryField(entry.id, 'qty_in', parseInt(e.target.value) || 0)}
                      className="bg-white py-5 text-lg border-blue-200 focus-visible:ring-blue-500" 
                    />
                  </div>

                  {/* TAB PANEL 2: OUT MATERIAL */}
                  <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-emerald-50/50", activeTab !== 'OUT' && "hidden")}>
                    <div className="space-y-2">
                      <Label className="text-emerald-700 font-bold">BARANG JADI (OUT OK)</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        value={entry.qty_out_ok === 0 ? '' : entry.qty_out_ok}
                        onChange={(e) => updateEntryField(entry.id, 'qty_out_ok', parseInt(e.target.value) || 0)}
                        className="bg-white py-5 text-lg border-emerald-200 focus-visible:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-700 font-bold">BARANG CACAT (OUT NG)</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        value={entry.qty_out_ng === 0 ? '' : entry.qty_out_ng}
                        onChange={(e) => updateEntryField(entry.id, 'qty_out_ng', parseInt(e.target.value) || 0)}
                        className="bg-white py-5 text-lg border-red-200 focus-visible:ring-red-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-bold">NAMA OPERATOR</Label>
                      <Input 
                        type="text" 
                        placeholder="Nama Operator Mesin" 
                        value={entry.operator_name}
                        onChange={(e) => updateEntryField(entry.id, 'operator_name', e.target.value)}
                        className="bg-white py-5 text-base border-slate-300 focus-visible:ring-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddEntry}
            className="w-full py-6 border-dashed border-2 text-slate-500 hover:text-slate-800 hover:border-slate-400 bg-slate-50"
          >
            + TAMBAH MATERIAL LAIN
          </Button>

          <Button 
            type="submit" 
            disabled={isPending}
            className={`w-full py-6 text-sm font-bold uppercase tracking-wider ${
              activeTab === 'IN' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPending ? 'MEREKAM DATA...' : (activeTab === 'IN' ? 'REKAM SELURUH MATERIAL MASUK' : 'KUNCI LAPORAN PRODUKSI SHIFT')}
          </Button>
          
        </form>
      </CardContent>
    </Card>
  )
}