// // src/app/api/export/pdf-harian/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
// import fs from 'fs/promises'
// import path from 'path'

// // DAFTAR INDUK UTUH 53 MATERIAL AKTIF (100% SINKRON DENGAN SUPABASE)
// const PART_ORDER = ["M2-AA033-B05","M2-AA030-B05","M2-AA077-B11","M2-AA034-B05","M2-AA029-B05","M2-AA072-A08","M2-AA041-B05","M2-AA028-B05","M2-AA038-B05","M4-A1001-D07","M4-A1002-D07","M2-BB002-B10","M2-BB001-B10","M2-BB004-B10","M2-BB005-B10","M2-BB006-B10","M2-BB010-B10","M4-A1079-D04","M4-A1123-D04","M2-BB019-B10","M2-BB022-B10","M2-AA180-B05","M2-AA185-B05","M2-BR004-E03","M2-AP051-C03","M2-AP052-C03","M2-AA193-B05","M2-AA214-B03","M2-AA215-B05","M2-BR045-E03","M2-AA208-B05","M2-BR075-E03","BRACKET KWNA","M4-A1170-D04","M2-BB049-B10","M2-BB050-B10","M2-BB032-B10","M2-BB042-B10","M2-BB043-B10","M2-BB044-B10","M2-BB045-B10","M2-BB046-B10","M2-BB047-B10","M2-BB051-B10","M2-AP011-C06","M2-BR116-E03","M4-A1069-D04","CF0015","M2-AK032-E03","M2-BB056-B10","M2-BB057-B10","M2-BB055-B10","M2-BB054-B10"]

// export async function GET(request: NextRequest) {
//   const searchParams = request.nextUrl.searchParams
//   const date = searchParams.get('date')

//   if (!date) return NextResponse.json({ error: 'Parameter tanggal wajib diisi' }, { status: 400 })

//   const supabase = await createClient()

//   // 1. SINGLE-REQUEST JOIN SUPER EFISIEN (Menarik Log, Master Part, dan Nama Leader)
//   const { data: logs, error } = await supabase
//     .from('production_logs')
//     .select(`
//       shift, stock_awal, qty_in, qty_out_ok, qty_out_ng, operator_name,
//       master_parts!production_logs_part_id_fkey ( part_number, part_name, part_type ),
//       leader:users!production_logs_leader_id_fkey ( full_name )
//     `)
//     .eq('date', date)

//   if (error) return NextResponse.json({ error: 'Gagal menarik data log produksi' }, { status: 500 })

//   // 2. Tarik Referensi Master Parts Global (Untuk List Kaku Kolom ITEM Halaman 1)
//   const { data: masterParts, error: masterError } = await supabase
//     .from('master_parts')
//     .select('part_number, part_type')

//   if (masterError) return NextResponse.json({ error: 'Gagal menarik data master parts' }, { status: 500 })

//   const partTypeMapping: Record<string, string> = {}
//   masterParts?.forEach((p) => {
//     partTypeMapping[p.part_number] = p.part_type || ''
//   })

//   // 3. REVISI: Tarik Nama Dept Head Langsung dari Session User yang Sedang Login
//   const { data: { user: authUser } } = await supabase.auth.getUser()
  
//   let deptHeadName = '-'
//   if (authUser) {
//     const { data: currentUserProfile } = await supabase
//       .from('users')
//       .select('full_name')
//       .eq('id', authUser.id)
//       .maybeSingle()
    
//     if (currentUserProfile) {
//       deptHeadName = currentUserProfile.full_name
//     }
//   }

//   // 4. Transformasi Data Grouping Map (Cast ke ': any' untuk mengamankan tipe relasi kustom)
//   const productionData: Record<string, any> = {}

//   logs?.forEach((log: any) => {
//     const partInfo = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts
//     const partNum = partInfo?.part_number
//     if (!partNum) return

//     if (!productionData[partNum]) {
//       productionData[partNum] = {
//         name: partInfo?.part_name || '',
//         type: partInfo?.part_type || '',
//         stockAwal: log.stock_awal,
//         shift1: { ok: '', leader: '', operator: '' },
//         shift2: { ok: '', leader: '', operator: '' },
//         shift3: { ok: '', leader: '', operator: '' },
//       }
//     }

//     const sisaStok = log.stock_awal + log.qty_in - log.qty_out_ok - log.qty_out_ng
//     const shiftKey = `shift${log.shift}` as 'shift1' | 'shift2' | 'shift3'
    
//     const leaderInfo = log.leader
//     const leaderFullName = Array.isArray(leaderInfo) ? leaderInfo[0]?.full_name : leaderInfo?.full_name

//     productionData[partNum][shiftKey] = {
//       in: log.qty_in > 0 ? log.qty_in.toString() : '',
//       ok: log.qty_out_ok > 0 ? log.qty_out_ok.toString() : '',
//       ng: log.qty_out_ng > 0 ? log.qty_out_ng.toString() : '',
//       sisa: sisaStok.toString(),
//       leader: leaderFullName || '',
//       operator: log.operator_name || '' // Sudah terekam & siap jika Anda ingin memetakan nama operator nanti
//     }
//   })

//   try {
//     const template2Path = path.join(process.cwd(), 'public', 'templates', 'daily_prod_report.pdf')
//     const pdfDoc2 = await PDFDocument.load(await fs.readFile(template2Path))

//     const pdfDoc = await PDFDocument.create()
//     const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
//     const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

//     const page1 = pdfDoc.addPage([842, 595])
    
//     // =========================================================================
//     // TAHAP A: IDENTITAS ATAS PERUSAHAAN (Halaman 1)
//     // =========================================================================
//     page1.drawText("PT. MITRA METAL PERKASA", { x: 30, y: 575, size: 9, font: fontHelveticaBold })
//     page1.drawText("LAPORAN PRODUKSI HARIAN PLATING", { x: 30, y: 562, size: 12, font: fontHelveticaBold })
//     page1.drawText(`TANGGAL LOG: ${date}`, { x: 700, y: 565, size: 8, font: fontHelveticaBold })

//     // =========================================================================
//     // TAHAP B: PENGGAMBARAN HEADER TABEL LANDSCAPE (Halaman 1)
//     // =========================================================================
//     const HEADER_Y = 535
//     const TABLE_LEFT_X = 30;
//     const TABLE_RIGHT_X = 812;

//     page1.drawRectangle({ x: TABLE_LEFT_X, y: HEADER_Y, width: TABLE_RIGHT_X - TABLE_LEFT_X, height: 22, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0, 0, 0), borderWidth: 1 })
//     page1.drawLine({ start: { x: 362, y: HEADER_Y + 11 }, end: { x: TABLE_RIGHT_X, y: HEADER_Y + 11 }, thickness: 0.8, color: rgb(0, 0, 0) })

//     page1.drawText("NO", { x: 36, y: HEADER_Y + 8, size: 6.5, font: fontHelveticaBold })
//     page1.drawText("IDENTITAS MATERIAL (ITEM)", { x: 130, y: HEADER_Y + 8, size: 7, font: fontHelveticaBold })
//     page1.drawText("STOCK AWAL", { x: 308, y: HEADER_Y + 8, size: 6, font: fontHelveticaBold })
    
//     page1.drawText("SHIFT 1", { x: 422, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })
//     page1.drawText("SHIFT 2", { x: 572, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })
//     page1.drawText("SHIFT 3", { x: 722, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })

//     const shiftStartX_positions: number[] = [362, 512, 662]
//     shiftStartX_positions.forEach((startX: number) => {
//       page1.drawText("IN", { x: startX + 12, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
//       page1.drawText("OK", { x: startX + 48, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
//       page1.drawText("NG", { x: startX + 85, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
//       page1.drawText("SISA", { x: startX + 118, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
//     })

//     // =========================================================================
//     // TAHAP C: AUTOMATION DATA TABEL 53 BARIS (Halaman 1)
//     // =========================================================================
//     const START_Y = 524;  
//     const ROW_GAP = 8.5;  

//     const X_COORDS = {
//       stockAwal: 332,
//       s1_in: 381, s1_ok: 418, s1_ng: 456, s1_sisa: 493,
//       s2_in: 531, s2_ok: 568, s2_ng: 606, s2_sisa: 643,
//       s3_in: 681, s3_ok: 718, s3_ng: 756, s3_sisa: 793,
//     }

//     const drawCellText = (text: string, x: number, y: number, isBold = false) => {
//       if (!text || text === '0') return
//       page1.drawText(text, {
//         x: x - (fontHelvetica.widthOfTextAtSize(text, 5) / 2), 
//         y,
//         size: 5,
//         font: isBold ? fontHelveticaBold : fontHelvetica,
//         color: rgb(0, 0, 0)
//       })
//     }

//     PART_ORDER.forEach((partNum, index) => {
//       const currentY = START_Y - (index * ROW_GAP)
//       const data = productionData[partNum]

//       const partType = partTypeMapping[partNum] || ''
//       const itemText = `${partNum} - ${partType}`

//       page1.drawText((index + 1).toString(), { x: 36, y: currentY, size: 5, font: fontHelvetica })
//       page1.drawText(itemText, { x: 65, y: currentY, size: 4.8, font: fontHelvetica })

//       page1.drawLine({
//         start: { x: TABLE_LEFT_X, y: currentY - 2 },
//         end: { x: TABLE_RIGHT_X, y: currentY - 2 },
//         thickness: 0.3,
//         color: rgb(0.4, 0.4, 0.4)
//       })

//       if (data) {
//         drawCellText(data.stockAwal?.toString(), X_COORDS.stockAwal, currentY)
        
//         drawCellText(data.shift1.in, X_COORDS.s1_in, currentY)
//         drawCellText(data.shift1.ok, X_COORDS.s1_ok, currentY)
//         drawCellText(data.shift1.ng, X_COORDS.s1_ng, currentY)
//         drawCellText(data.shift1.sisa, X_COORDS.s1_sisa, currentY, true)

//         drawCellText(data.shift2.in, X_COORDS.s2_in, currentY)
//         drawCellText(data.shift2.ok, X_COORDS.s2_ok, currentY)
//         drawCellText(data.shift2.ng, X_COORDS.s2_ng, currentY)
//         drawCellText(data.shift2.sisa, X_COORDS.s2_sisa, currentY, true)

//         drawCellText(data.shift3.in, X_COORDS.s3_in, currentY)
//         drawCellText(data.shift3.ok, X_COORDS.s3_ok, currentY)
//         drawCellText(data.shift3.ng, X_COORDS.s3_ng, currentY)
//         drawCellText(data.shift3.sisa, X_COORDS.s3_sisa, currentY, true)
//       }
//     })

//     const TABLE_BOTTOM_Y = START_Y - (PART_ORDER.length * ROW_GAP) - 2
//     const VERTICAL_X_POSITIONS = [
//       TABLE_LEFT_X, 50, 302, 362, 
//       399.5, 437, 474.5, 512, 
//       549.5, 587, 624.5, 662, 
//       699.5, 737, 774.5, TABLE_RIGHT_X
//     ]

//     VERTICAL_X_POSITIONS.forEach((xPos) => {
//       const isMajorBoundary = xPos === TABLE_LEFT_X || xPos === TABLE_RIGHT_X || xPos === 302 || xPos === 362 || xPos === 512 || xPos === 662
//       page1.drawLine({
//         start: { x: xPos, y: HEADER_Y + 22 },
//         end: { x: xPos, y: TABLE_BOTTOM_Y },
//         thickness: isMajorBoundary ? 0.8 : 0.4,
//         color: rgb(0, 0, 0)
//       })
//     })

//     // =========================================================================
//     // TAHAP E: GENERATE MULTI-PAGES HALAMAN 2 (SINKRONISASI REVISI TOTAL)
//     // =========================================================================
//     const activePartNumbers = Object.keys(productionData)

//     // Titik koordinat X yang sudah disesuaikan agar tulisan pas di tengah sel masing-masing Shift
//     const H2_X_HEADER = [75, 325, 575]    // Titik awal X untuk penulisan teks rata kiri di header shift
//     const H2_X_OK_CELL = [250, 480, 730]  // Titik X Tengah kolom kuantitas baris "OK"
//     const H2_X_LEADER = [125, 375, 625]   // Titik X Tengah kolom tanda tangan LEADER
//     const H2_X_DEPT    = [275, 525, 775]   // Titik X Tengah kolom tanda tangan DEPT HEAD

//     for (let i = 0; i < activePartNumbers.length; i++) {
//       const partNum = activePartNumbers[i]
//       const pData = productionData[partNum]

//       const [copiedPage2] = await pdfDoc.copyPages(pdfDoc2, [0])
//       pdfDoc.addPage(copiedPage2)

//       const newPageIndex = pdfDoc.getPageCount() - 1
//       const currentPage = pdfDoc.getPage(newPageIndex)

//       // 1. Stempel Parameter Tanggal Kerja
//       currentPage.drawText(date || '', { x: 90, y: 503, size: 8, font: fontHelveticaBold, color: rgb(0, 0, 0) })

//       // Loop paralel pengisian data internal 3 Shift kerja pabrik
//       for (let shiftIdx = 0; shiftIdx < 3; shiftIdx++) {
//         const shiftKey = `shift${shiftIdx + 1}`
//         const sData = pData[shiftKey] || { ok: '', leader: '', operator: '' }

//         // REVISI 2: PROD.NAME diisi part_type, MODEL/TYPE diisi part_number
//         currentPage.drawText(pData.type, { x: H2_X_HEADER[shiftIdx], y: 468, size: 7.5, font: fontHelvetica, color: rgb(0, 0, 0) })
//         currentPage.drawText(partNum, { x: H2_X_HEADER[shiftIdx], y: 453, size: 7.5, font: fontHelvetica, color: rgb(0, 0, 0) })

//         // REVISI 3: Suntik jumlah output OK aktual ke kolom "OK" utama (Y = 428)
//         if (sData.ok && sData.ok !== '0') {
//           currentPage.drawText(sData.ok, {
//             x: H2_X_OK_CELL[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.ok, 7.5) / 2),
//             y: 440,
//             size: 7.5,
//             font: fontHelveticaBold,
//             color: rgb(1, 1, 1)
//           })
//         }

//         // REVISI 4: Masukkan nama Leader dari database hasil Join ke kolom LEADER (Y = 68)
//         if (sData.leader) {
//           currentPage.drawText(sData.leader, {
//             x: H2_X_LEADER[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.leader, 7) / 2),
//             y: 68,
//             size: 7,
//             font: fontHelvetica,
//             color: rgb(0, 0, 0)
//           })
//         }

//         // REVISI 4: Masukkan nama Department Head dari Session User yang login ke kolom DEPT HEAD (Y = 68)
//         if (deptHeadName && deptHeadName !== '-') {
//           currentPage.drawText(deptHeadName, {
//             x: H2_X_DEPT[shiftIdx] - (fontHelvetica.widthOfTextAtSize(deptHeadName, 7) / 2),
//             y: 68,
//             size: 7,
//             font: fontHelvetica,
//             color: rgb(0, 0, 0)
//           })
//         }
//       }
//     }

//     // =========================================================
// //     // TRIK SEMENTARA: CETAK PETA KOORDINAT (GRID RAPAT)
// //     // =========================================================
// //     // Ambil SEMUA halaman yang sudah selesai digabungkan (termasuk duplikat hal 2)
//     const allPages = pdfDoc.getPages();
    
//     allPages.forEach((page) => {
//       const { width, height } = page.getSize();
      
//       // Gambar garis X (Mendatar/Kolom) tiap 10 poin
//       for (let x = 0; x <= width; x += 10) {
//         const isMajor = x % 50 === 0; // Garis tebal tiap 50
//         page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: isMajor ? 0.5 : 0.1, color: rgb(1, 0, 0), opacity: isMajor ? 0.6 : 0.3 });
//       }

//       // Gambar garis Y (Menurun/Baris) tiap 10 poin beserta angkanya
//       for (let y = 0; y <= height; y += 10) {
//         const isMajor = y % 50 === 0; // Garis tebal tiap 50
//         page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: isMajor ? 0.5 : 0.1, color: rgb(1, 0, 0), opacity: isMajor ? 0.6 : 0.3 });
        
//         // Hanya tulis teks angka di persimpangan garis besar (50x50) agar tidak menumpuk
//         if (isMajor) {
//           for (let x = 0; x <= width; x += 50) {
//             page.drawText(`${x},${y}`, { x: x + 1, y: y + 2, size: 6, color: rgb(1, 0, 0) });
//           }
//         }
//       }
//     });
// //     // =========================================================

//     const pdfBytes = await pdfDoc.save()

//     return new NextResponse(Buffer.from(pdfBytes), {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': `attachment; filename="Laporan_Produksi_${date}.pdf"`,
//       },
//     })

//   } catch (err) {
//     console.error('Error generating final revised Landscape PDF:', err)
//     return NextResponse.json({ error: 'Gagal memproses pembuatan laporan cetak.' }, { status: 500 })
//   }
// }

// src/app/api/export/pdf-harian/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

// DAFTAR INDUK UTUH 53 MATERIAL AKTIF
const PART_ORDER = ["M2-AA033-B05","M2-AA030-B05","M2-AA077-B11","M2-AA034-B05","M2-AA029-B05","M2-AA072-A08","M2-AA041-B05","M2-AA028-B05","M2-AA038-B05","M4-A1001-D07","M4-A1002-D07","M2-BB002-B10","M2-BB001-B10","M2-BB004-B10","M2-BB005-B10","M2-BB006-B10","M2-BB010-B10","M4-A1079-D04","M4-A1123-D04","M2-BB019-B10","M2-BB022-B10","M2-AA180-B05","M2-AA185-B05","M2-BR004-E03","M2-AP051-C03","M2-AP052-C03","M2-AA193-B05","M2-AA214-B03","M2-AA215-B05","M2-BR045-E03","M2-AA208-B05","M2-BR075-E03","BRACKET KWNA","M4-A1170-D04","M2-BB049-B10","M2-BB050-B10","M2-BB032-B10","M2-BB042-B10","M2-BB043-B10","M2-BB044-B10","M2-BB045-B10","M2-BB046-B10","M2-BB047-B10","M2-BB051-B10","M2-AP011-C06","M2-BR116-E03","M4-A1069-D04","CF0015","M2-AK032-E03","M2-BB056-B10","M2-BB057-B10","M2-BB055-B10","M2-BB054-B10"]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')

  if (!date) return NextResponse.json({ error: 'Parameter tanggal wajib diisi' }, { status: 400 })

  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('production_logs')
    .select(`
      shift, stock_awal, qty_in, qty_out_ok, qty_out_ng, operator_name,
      master_parts!production_logs_part_id_fkey ( part_number, part_name, part_type ),
      leader:users!production_logs_leader_id_fkey ( alias_name )
    `)
    .eq('date', date)

  if (error) return NextResponse.json({ error: 'Gagal menarik data log produksi' }, { status: 500 })

  const { data: masterParts, error: masterError } = await supabase
    .from('master_parts')
    .select('part_number, part_type')

  if (masterError) return NextResponse.json({ error: 'Gagal menarik data master parts' }, { status: 500 })

  const partTypeMapping: Record<string, string> = {}
  masterParts?.forEach((p) => {
    partTypeMapping[p.part_number] = p.part_type || ''
  })

  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let deptHeadName = '-'
  if (authUser) {
    const { data: currentUserProfile } = await supabase
      .from('users')
      .select('full_name, alias_name')
      .eq('id', authUser.id)
      .maybeSingle()
    
    if (currentUserProfile) {
      deptHeadName = currentUserProfile.alias_name
    }
  }

  const productionData: Record<string, any> = {}

  logs?.forEach((log: any) => {
    const partInfo = Array.isArray(log.master_parts) ? log.master_parts[0] : log.master_parts
    const partNum = partInfo?.part_number
    if (!partNum) return

    if (!productionData[partNum]) {
      productionData[partNum] = {
        name: partInfo?.part_name || '',
        type: partInfo?.part_type || '',
        stockAwal: log.stock_awal,
        shift1: null,
        shift2: null,
        shift3: null,
      }
    }

    const sisaStok = log.stock_awal + log.qty_in - log.qty_out_ok - log.qty_out_ng
    const shiftKey = `shift${log.shift}` as 'shift1' | 'shift2' | 'shift3'
    
    const leaderInfo = log.leader
    // Ambil alias_name, jika kosong ambil full_name, jika masih kosong gunakan string kosong
    const leaderAlias = Array.isArray(leaderInfo) ? leaderInfo[0]?.alias_name : leaderInfo?.alias_name
    const leaderFull = Array.isArray(leaderInfo) ? leaderInfo[0]?.full_name : leaderInfo?.full_name
    
    const leaderFinalName = leaderAlias || leaderFull?.split(' ')[0] || ''

    productionData[partNum][shiftKey] = {
      in: log.qty_in > 0 ? log.qty_in.toString() : '',
      ok: log.qty_out_ok > 0 ? log.qty_out_ok.toString() : '',
      ng: log.qty_out_ng > 0 ? log.qty_out_ng.toString() : '',
      sisa: sisaStok.toString(),
      leader: leaderFinalName,
      operator: log.operator_name || '',
      hasData: true
    }
  })

  try {
    const template2Path = path.join(process.cwd(), 'public', 'templates', 'daily_prod_report.pdf')
    const pdfDoc2 = await PDFDocument.load(await fs.readFile(template2Path))

    const pdfDoc = await PDFDocument.create()
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const page1 = pdfDoc.addPage([842, 595])
    
    page1.drawText("PT. MITRA METAL PERKASA", { x: 30, y: 575, size: 9, font: fontHelveticaBold })
    page1.drawText("LAPORAN PRODUKSI HARIAN PLATING", { x: 30, y: 562, size: 12, font: fontHelveticaBold })
    page1.drawText(`TANGGAL LOG: ${date}`, { x: 700, y: 565, size: 8, font: fontHelveticaBold })

    const HEADER_Y = 535
    const TABLE_LEFT_X = 30;
    const TABLE_RIGHT_X = 812;

    page1.drawRectangle({ x: TABLE_LEFT_X, y: HEADER_Y, width: TABLE_RIGHT_X - TABLE_LEFT_X, height: 22, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0, 0, 0), borderWidth: 1 })
    page1.drawLine({ start: { x: 362, y: HEADER_Y + 11 }, end: { x: TABLE_RIGHT_X, y: HEADER_Y + 11 }, thickness: 0.8, color: rgb(0, 0, 0) })

    page1.drawText("NO", { x: 36, y: HEADER_Y + 8, size: 6.5, font: fontHelveticaBold })
    page1.drawText("IDENTITAS MATERIAL (ITEM)", { x: 130, y: HEADER_Y + 8, size: 7, font: fontHelveticaBold })
    page1.drawText("STOCK AWAL", { x: 308, y: HEADER_Y + 8, size: 6, font: fontHelveticaBold })
    
    page1.drawText("SHIFT 1", { x: 422, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })
    page1.drawText("SHIFT 2", { x: 572, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })
    page1.drawText("SHIFT 3", { x: 722, y: HEADER_Y + 14, size: 6.5, font: fontHelveticaBold })

    const shiftStartX_positions: number[] = [362, 512, 662]
    shiftStartX_positions.forEach((startX: number) => {
      page1.drawText("IN", { x: startX + 12, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
      page1.drawText("OK", { x: startX + 48, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
      page1.drawText("NG", { x: startX + 85, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
      page1.drawText("SISA", { x: startX + 118, y: HEADER_Y + 3, size: 5.5, font: fontHelveticaBold })
    })

    const START_Y = 524;  
    const ROW_GAP = 8.5;  

    const X_COORDS = {
      stockAwal: 332,
      s1_in: 381, s1_ok: 418, s1_ng: 456, s1_sisa: 493,
      s2_in: 531, s2_ok: 568, s2_ng: 606, s2_sisa: 643,
      s3_in: 681, s3_ok: 718, s3_ng: 756, s3_sisa: 793,
    }

    const drawCellText = (text: string, x: number, y: number, isBold = false) => {
      if (!text || text === '0') return
      page1.drawText(text, {
        x: x - (fontHelvetica.widthOfTextAtSize(text, 5) / 2), 
        y,
        size: 5,
        font: isBold ? fontHelveticaBold : fontHelvetica,
        color: rgb(0, 0, 0)
      })
    }

    PART_ORDER.forEach((partNum, index) => {
      const currentY = START_Y - (index * ROW_GAP)
      const data = productionData[partNum]

      const partType = partTypeMapping[partNum] || ''
      const itemText = `${partNum} - ${partType}`

      page1.drawText((index + 1).toString(), { x: 36, y: currentY, size: 5, font: fontHelvetica })
      page1.drawText(itemText, { x: 65, y: currentY, size: 4.8, font: fontHelvetica })

      page1.drawLine({
        start: { x: TABLE_LEFT_X, y: currentY - 2 },
        end: { x: TABLE_RIGHT_X, y: currentY - 2 },
        thickness: 0.3,
        color: rgb(0.4, 0.4, 0.4)
      })

      if (data) {
        drawCellText(data.stockAwal?.toString(), X_COORDS.stockAwal, currentY)
        
        drawCellText(data.shift1?.in, X_COORDS.s1_in, currentY)
        drawCellText(data.shift1?.ok, X_COORDS.s1_ok, currentY)
        drawCellText(data.shift1?.ng, X_COORDS.s1_ng, currentY)
        drawCellText(data.shift1?.sisa, X_COORDS.s1_sisa, currentY, true)

        drawCellText(data.shift2?.in, X_COORDS.s2_in, currentY)
        drawCellText(data.shift2?.ok, X_COORDS.s2_ok, currentY)
        drawCellText(data.shift2?.ng, X_COORDS.s2_ng, currentY)
        drawCellText(data.shift2?.sisa, X_COORDS.s2_sisa, currentY, true)

        drawCellText(data.shift3?.in, X_COORDS.s3_in, currentY)
        drawCellText(data.shift3?.ok, X_COORDS.s3_ok, currentY)
        drawCellText(data.shift3?.ng, X_COORDS.s3_ng, currentY)
        drawCellText(data.shift3?.sisa, X_COORDS.s3_sisa, currentY, true)
      }
    })

    const TABLE_BOTTOM_Y = START_Y - (PART_ORDER.length * ROW_GAP) - 2
    const VERTICAL_X_POSITIONS = [
      TABLE_LEFT_X, 50, 302, 362, 
      399.5, 437, 474.5, 512, 
      549.5, 587, 624.5, 662, 
      699.5, 737, 774.5, TABLE_RIGHT_X
    ]

    VERTICAL_X_POSITIONS.forEach((xPos) => {
      const isMajorBoundary = xPos === TABLE_LEFT_X || xPos === TABLE_RIGHT_X || xPos === 302 || xPos === 362 || xPos === 512 || xPos === 662
      page1.drawLine({
        start: { x: xPos, y: HEADER_Y + 22 },
        end: { x: xPos, y: TABLE_BOTTOM_Y },
        thickness: isMajorBoundary ? 0.8 : 0.4,
        color: rgb(0, 0, 0)
      })
    })

    // =========================================================================
    // TAHAP E: GENERATE MULTI-PAGES HALAMAN 2 (AKURASI TEPAT SHIFT AKTIF)
    // =========================================================================
    const activePartNumbers = Object.keys(productionData)

    const H2_X_HEADER = [75, 325, 575]    
    const H2_X_OK_CELL = [250, 480, 730]  
    const H2_X_NG_CELL = [250, 480, 730]  
    
    // KOORDINAT BARU UNTUK NAMA OPERATOR (Diperkirakan di atas kolom pertama signature)
    const H2_X_OPERATOR = [60, 300, 540]
    const H2_X_LEADER = [155, 397.5, 635]   
    const H2_X_DEPT    = [250, 490, 735]   

    for (let i = 0; i < activePartNumbers.length; i++) {
      const partNum = activePartNumbers[i]
      const pData = productionData[partNum]

      const [copiedPage2] = await pdfDoc.copyPages(pdfDoc2, [0])
      pdfDoc.addPage(copiedPage2)

      const newPageIndex = pdfDoc.getPageCount() - 1
      const currentPage = pdfDoc.getPage(newPageIndex)

      currentPage.drawText(date || '', { x: 70, y: 497, size: 8, font: fontHelveticaBold, color: rgb(0, 0, 0) })

      for (let shiftIdx = 0; shiftIdx < 3; shiftIdx++) {
        const shiftKey = `shift${shiftIdx + 1}`
        const sData = pData[shiftKey]

        if (!sData || !sData.hasData) continue

        currentPage.drawText(pData.type, { x: H2_X_HEADER[shiftIdx], y: 468, size: 7.5, font: fontHelvetica, color: rgb(0, 0, 0) })
        currentPage.drawText(partNum, { x: H2_X_HEADER[shiftIdx], y: 453, size: 7.5, font: fontHelvetica, color: rgb(0, 0, 0) })

        if (sData.ok && sData.ok !== '0') {
          currentPage.drawText(sData.ok, {
            x: H2_X_OK_CELL[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.ok, 7.5) / 2),
            y: 440,
            size: 7.5,
            font: fontHelveticaBold,
            color: rgb(1, 1, 1) 
          })
        }
        
        if (sData.ng && sData.ng !== '0') {
          currentPage.drawText(sData.ng, {
            x: H2_X_NG_CELL[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.ng, 7.5) / 2),
            y: 363, // <- SILAKAN SESUAIKAN KOORDINAT Y INI
            size: 7.5,
            font: fontHelveticaBold,
            color: rgb(1, 1, 1) // Saya buatkan warna merah (rgb 1,0,0) agar mudah Anda cari saat debugging posisi
          })
        }

        // CETAK NAMA OPERATOR
        if (sData.operator) {
          currentPage.drawText(sData.operator, {
            x: H2_X_OPERATOR[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.operator, 7) / 2),
            y: 145, // Sejajar dengan tanda tangan Leader
            size: 7,
            font: fontHelvetica,
            color: rgb(0, 0, 0)
          })
        }

        if (sData.leader) {
          currentPage.drawText(sData.leader, {
            x: H2_X_LEADER[shiftIdx] - (fontHelvetica.widthOfTextAtSize(sData.leader, 7) / 2),
            y: 145,
            size: 7,
            font: fontHelvetica,
            color: rgb(0, 0, 0)
          })
        }

        if (deptHeadName && deptHeadName !== '-') {
          currentPage.drawText(deptHeadName, {
            x: H2_X_DEPT[shiftIdx] - (fontHelvetica.widthOfTextAtSize(deptHeadName, 7) / 2),
            y: 145,
            size: 7,
            font: fontHelvetica,
            color: rgb(0, 0, 0)
          })
        }
      }
    }

//     // TRIK SEMENTARA: CETAK PETA KOORDINAT (GRID RAPAT)
//     // =========================================================
//     // Ambil SEMUA halaman yang sudah selesai digabungkan (termasuk duplikat hal 2)
    // const allPages = pdfDoc.getPages();
    
    // allPages.forEach((page) => {
    //   const { width, height } = page.getSize();
      
    //   // Gambar garis X (Mendatar/Kolom) tiap 10 poin
    //   for (let x = 0; x <= width; x += 10) {
    //     const isMajor = x % 50 === 0; // Garis tebal tiap 50
    //     page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: isMajor ? 0.5 : 0.1, color: rgb(1, 0, 0), opacity: isMajor ? 0.6 : 0.3 });
    //   }

    //   // Gambar garis Y (Menurun/Baris) tiap 10 poin beserta angkanya
    //   for (let y = 0; y <= height; y += 10) {
    //     const isMajor = y % 50 === 0; // Garis tebal tiap 50
    //     page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: isMajor ? 0.5 : 0.1, color: rgb(1, 0, 0), opacity: isMajor ? 0.6 : 0.3 });
        
    //     // Hanya tulis teks angka di persimpangan garis besar (50x50) agar tidak menumpuk
    //     if (isMajor) {
    //       for (let x = 0; x <= width; x += 50) {
    //         page.drawText(`${x},${y}`, { x: x + 1, y: y + 2, size: 6, color: rgb(1, 0, 0) });
    //       }
    //     }
    //   }
    // });
//     // =========================================================

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Laporan_Produksi_${date}.pdf"`,
      },
    })

  } catch (err) {
    console.error('Error generating final revised Landscape PDF:', err)
    return NextResponse.json({ error: 'Gagal memproses pembuatan laporan cetak.' }, { status: 500 })
  }
}