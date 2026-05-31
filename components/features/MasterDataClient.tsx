// src/components/features/MasterDataClient.tsx
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { addPart, editPart, deletePart, type MasterActionState } from '@/actions/master'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, DatabaseBackup, Pencil, Filter } from 'lucide-react'

type MasterPart = { id: string, part_name: string, part_type: string, part_number: string }
const initialState: MasterActionState = { error: '' }

export default function MasterDataClient({ initialParts }: { initialParts: MasterPart[] }) {
  // State untuk Tambah Data
  const [addState, addAction, isAddPending] = useActionState(addPart, initialState)
  const addFormRef = useRef<HTMLFormElement>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // State untuk Edit Data
  const [editState, editAction, isEditPending] = useActionState(editPart, initialState)
  const editFormRef = useRef<HTMLFormElement>(null)
  const [editingPart, setEditingPart] = useState<MasterPart | null>(null)

  // State untuk Filter & Hapus
  const [deleteStatus, setDeleteStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  // Ekstrak Kategori Unik untuk Dropdown Filter
  const uniqueCategories = Array.from(new Set(initialParts.map(p => p.part_name))).sort()
  
  // Logika Filter
  const filteredParts = filterCategory === 'ALL' 
    ? initialParts 
    : initialParts.filter(p => p.part_name === filterCategory)

  // Efek jika tambah data sukses
  useEffect(() => {
    if (addState.success) {
      addFormRef.current?.reset()
      setIsAddDialogOpen(false)
      const timer = setTimeout(() => addState.success = '', 3000)
      return () => clearTimeout(timer)
    }
  }, [addState.success])

  // Efek jika edit data sukses
  useEffect(() => {
    if (editState.success) {
      editFormRef.current?.reset()
      setEditingPart(null)
      const timer = setTimeout(() => editState.success = '', 3000)
      return () => clearTimeout(timer)
    }
  }, [editState.success])

  // Fungsi Hapus
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus part ${name}?`)) return
    setDeleteStatus('Menghapus...')
    const res = await deletePart(id)
    if (res?.error) alert(res.error)
    setDeleteStatus('')
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER, FILTER & TOMBOL TAMBAH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Direktori Material</h2>
            <p className="text-sm text-slate-500">Tampil {filteredParts.length} dari {initialParts.length} spesifikasi</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          
          {/* KOMPONEN FILTER KATEGORI */}
          <div className="w-full sm:w-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-50 border-slate-200 font-medium text-slate-700">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-blue-600">Semua Kategori</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DIALOG TAMBAH PART */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-semibold tracking-wide shadow-sm shadow-blue-600/20">
                <Plus className="w-4 h-4 mr-2" /> TAMBAH MATERIAL
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrasi Material Baru</DialogTitle>
                <DialogDescription>Masukkan kategori, spesifikasi detail, dan nomor part.</DialogDescription>
              </DialogHeader>
              <form ref={addFormRef} action={addAction} className="space-y-4 pt-4">
                {addState.error && <div className="p-2 bg-red-50 text-red-600 text-sm rounded-md">{addState.error}</div>}
                <div className="space-y-2"><Label>Kategori (Misal: BRAKE)</Label><Input name="part_name" required className="uppercase" /></div>
                <div className="space-y-2"><Label>Spesifikasi Detail</Label><Input name="part_type" required className="uppercase" /></div>
                <div className="space-y-2"><Label>Nomor Part / ID Internal</Label><Input name="part_number" required className="uppercase" /></div>
                <Button type="submit" disabled={isAddPending} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                  {isAddPending ? 'MENYIMPAN...' : 'SIMPAN DATA'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* NOTIFIKASI STATUS */}
      {addState.success && <div className="p-4 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded-lg shadow-sm">{addState.success}</div>}
      {editState.success && <div className="p-4 bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded-lg shadow-sm">{editState.success}</div>}
      {deleteStatus && <div className="p-4 bg-amber-50 text-amber-700 font-semibold border border-amber-200 rounded-lg shadow-sm">{deleteStatus}</div>}

      {/* TABEL DATA MASTER (Menggunakan data ter-filter) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px] text-center">No</TableHead>
                <TableHead>Kategori Part</TableHead>
                <TableHead>Spesifikasi Detail</TableHead>
                <TableHead>Nomor Part</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-slate-500">Tidak ada material yang cocok dengan filter.</TableCell>
                </TableRow>
              ) : (
                filteredParts.map((part, index) => (
                  <TableRow key={part.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-bold text-slate-800">{part.part_name}</TableCell>
                    <TableCell className="text-slate-600">{part.part_type}</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded w-max inline-block mt-2.5">
                      {part.part_number}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {/* Tombol Edit */}
                      <Button 
                        variant="ghost" size="icon" 
                        onClick={() => setEditingPart(part)}
                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 mr-1"
                        title="Edit Part"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {/* Tombol Hapus */}
                      <Button 
                        variant="ghost" size="icon" 
                        onClick={() => handleDelete(part.id, part.part_type)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Hapus Part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* DIALOG EDIT PART (Terbuka saat tombol pensil ditekan) */}
      <Dialog open={!!editingPart} onOpenChange={(open) => !open && setEditingPart(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Material</DialogTitle>
            <DialogDescription>Perbarui informasi kategori, spesifikasi detail, atau nomor part.</DialogDescription>
          </DialogHeader>
          <form ref={editFormRef} action={editAction} className="space-y-4 pt-4">
            {editState.error && <div className="p-2 bg-red-50 text-red-600 text-sm rounded-md">{editState.error}</div>}
            
            <input type="hidden" name="id" value={editingPart?.id || ''} />
            
            <div className="space-y-2"><Label>Kategori</Label><Input name="part_name" required defaultValue={editingPart?.part_name} className="uppercase" /></div>
            <div className="space-y-2"><Label>Spesifikasi Detail</Label><Input name="part_type" required defaultValue={editingPart?.part_type} className="uppercase" /></div>
            <div className="space-y-2"><Label>Nomor Part / ID</Label><Input name="part_number" required defaultValue={editingPart?.part_number} className="uppercase" /></div>
            <Button type="submit" disabled={isEditPending} className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-2">
              {isEditPending ? 'MEMPERBARUI...' : 'SIMPAN PERUBAHAN'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}