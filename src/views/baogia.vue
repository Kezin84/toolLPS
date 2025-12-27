<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

/* ======================
   CONFIG
====================== */
const BASE_URL =
  'https://script.google.com/macros/s/AKfycbzYx6vHJJhHB8eLv0Ldr_QZ4Y9GzLMrAeFMGfK-RMYjl7Zjl1YjCz8Is01alAYuGRNB/exec'

/* ======================
   TYPES
====================== */
type HangHoa = {
  Ma_hang: string
  Ten_hang: string
  Main_img: string
  Ma_nha_cung_cap: string
  Ten_nha_cung_cap: string
  Mo_ta_chung: string
  Mo_ta_chi_tiet: string
  Features: string
  Danh_muc: string
  License_duration: string
  DVT: string
  Gia_tieu_chuan: number
  Don_gia: number
  Trang_thai: string
  Don_vi_tien_te: string
  Ti_gia: number
  Thue_VAT: number
  Ma_hang_lien_ket: string
  Ten_hang_lien_ket: string
  Ghi_chu: string
}

type KhachHang = {
  Ma_khach_hang: string
  Ten_khach_hang: string
  Email_ca_nhan: string
  So_dien_thoai_ca_nhan: string
  Ma_cong_ty: string
  Ten_cong_ty: string
  So_dien_thoai_cong_ty: string
  So_fax_cong_ty: string
  Dia_chi_cong_ty: string
  Email_cong_ty: string
  Website_cong_ty: string
  Trang_thai: string
  Cong_no_chua_thanh_toan: string
  Ghi_chu: string
}

/* ======================
   1. KHÁCH HÀNG
====================== */
const khach = ref<KhachHang>({
  Ma_khach_hang: '',
  Ten_khach_hang: '',
  Email_ca_nhan: '',
  So_dien_thoai_ca_nhan: '',
  Ma_cong_ty: '',
  Ten_cong_ty: '',
  So_dien_thoai_cong_ty: '',
  So_fax_cong_ty: '',
  Dia_chi_cong_ty: '',
  Email_cong_ty: '',
  Website_cong_ty: '',
  Trang_thai: '',
  Cong_no_chua_thanh_toan: '',
  Ghi_chu: ''
})

const customers = ref<KhachHang[]>([])
const maKHInput = ref('')
const tenKHInput = ref('')

/* ======================
   5. HỢP ĐỒNG
====================== */
const maHopDong = ref(`HD${new Date().toISOString().replace(/\D/g, '')}`)
const soHopDong = ref('')
const ghiChuHopDong = ref('')
const loadedMaHopDong = ref<string | null>(null)
/* ======================
   MODAL CHỌN SỐ HĐ SO SÁNH
====================== */
const showPickCompareModal = ref(false)
const pickCompareSo = ref('')

/* ======================
   HÀNG HÓA
====================== */
const products = ref<HangHoa[]>([])
const keyword = ref('')
const supplierFilter = ref('ALL')
const showVND = ref(false)
const selectedItems = ref<(HangHoa & { So_luong: number })[]>([])

/* qty realtime trong card */
const qtyMap = reactive<Record<string, number>>({})

/* ======================
   MODAL - NHẬP TAY / CHI TIẾT CARD / XEM BÁO GIÁ
====================== */
const showManualModal = ref(false)
const showCardModal = ref(false)
const showPreviewModal = ref(false)

const itemForm = ref<HangHoa & { So_luong: number }>({
  Ma_hang: '',
  Ten_hang: '',
  Main_img: '',
  Ma_nha_cung_cap: '',
  Ten_nha_cung_cap: '',
  Mo_ta_chung: '',
  Mo_ta_chi_tiet: '',
  Features: '',
  Danh_muc: '',
  License_duration: '',
  DVT: '',
  Gia_tieu_chuan: 0,
  Don_gia: 0,
  Trang_thai: 'Hiển thị',
  Don_vi_tien_te: 'VND',
  Ti_gia: 1,
  Thue_VAT: 0,
  Ma_hang_lien_ket: '',
  Ten_hang_lien_ket: '',
  Ghi_chu: '',
  So_luong: 1
})

const cardEdit = ref<HangHoa & { So_luong: number } | null>(null)

/* ======================
   SIDEBAR TOGGLE
====================== */
const showCustomerSidebar = ref(true)
const showContractSidebar = ref(true)

/* ======================
   HELPERS
====================== */
/* ======================
   ✅ LOAD HÓA ĐƠN / HỢP ĐỒNG
====================== */
const showLoadInvoiceModal = ref(false)
/* ======================
   🔍 SO SÁNH HỢP ĐỒNG
====================== */
const showCompareModal = ref(false)
const compareSoHopDong = ref('')

const compareDetails = ref<any[][]>([]) // toàn bộ hop_dong_chi_tiet của SỐ HĐ

const loadMode = ref<'SO' | 'MA'>('SO') // SO = số hợp đồng, MA = mã hợp đồng
const loadKey = ref('')
const loadingInvoice = ref(false)
const loadMsg = ref('')

// list hợp đồng để chọn
const contractsRaw = ref<any[][]>([])

/* datalist options */
const contractOptionsBySo = computed(() => {
  const set = new Set<string>()
  contractsRaw.value.forEach(r => {
    const so = String(r?.[1] ?? '').trim()
    if (so) set.add(so)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})
const contractOptionsByMa = computed(() => {
  const set = new Set<string>()
  contractsRaw.value.forEach(r => {
    const ma = String(r?.[0] ?? '').trim()
    if (ma) set.add(ma)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

/* map 1 row hop_dong_chi_tiet -> item selectedItems */
function mapHopDongChiTietRowToItem(row: any[]) {
  // tolerate length
  // buildHopDongChiTietRows() của mày đang trả:
  // [0]ma_hop_dong [1]so_hop_dong [2]Ma_hang [3]Ten_hang [4]Main_img
  // [5]Ma_ncc [6]Ten_ncc [7]Mo_ta_chung [8]Mo_ta_chi_tiet [9]Features [10]Danh_muc
  // [11]License_duration [12]DVT [13]Gia_tieu_chuan [14]Don_gia [15]Don_vi_tien_te
  // [16]Ti_gia [17]Thue_VAT [18]So_luong [19]Ghi_chu
  const item: HangHoa & { So_luong: number } = {
    Ma_hang: String(row?.[2] ?? ''),
    Ten_hang: String(row?.[3] ?? ''),
    Main_img: String(row?.[4] ?? ''),
    Ma_nha_cung_cap: String(row?.[5] ?? ''),
    Ten_nha_cung_cap: String(row?.[6] ?? ''),
    Mo_ta_chung: String(row?.[7] ?? ''),
    Mo_ta_chi_tiet: String(row?.[8] ?? ''),
    Features: String(row?.[9] ?? ''),
    Danh_muc: String(row?.[10] ?? ''),
    License_duration: String(row?.[11] ?? ''),
    DVT: String(row?.[12] ?? ''),
    Gia_tieu_chuan: toNum(row?.[13], 0),
    Don_gia: toNum(row?.[14], 0),
    Trang_thai: 'Hiển thị',
    Don_vi_tien_te: String(row?.[15] ?? 'VND'),
    Ti_gia: toNum(row?.[16], 1),
    Thue_VAT: toNum(row?.[17], 0),
    Ma_hang_lien_ket: '',
    Ten_hang_lien_ket: '',
    Ghi_chu: String(row?.[19] ?? ''),
    So_luong: Math.max(1, toNum(row?.[18], 1))
  }

  return item
}

/* tìm row tổng quát theo số/mã */
function findContractRow() {
  const key = loadKey.value.trim()
  if (!key) return null
  if (loadMode.value === 'SO') {
    return contractsRaw.value.find(r => String(r?.[1] ?? '').trim() === key) || null
  }
  return contractsRaw.value.find(r => String(r?.[0] ?? '').trim() === key) || null
}

async function loadInvoiceToFE() {
  loadMsg.value = ''
  const row = findContractRow()
  if (!row) {
    loadMsg.value = '❌ Không tìm thấy hóa đơn/hợp đồng theo mã/số đã chọn.'
    return
  }

  try {
    loadingInvoice.value = true

const ma = String(row?.[0] ?? '').trim()
const so = String(row?.[1] ?? '').trim()

loadedMaHopDong.value = ma              // ✅ GHI NHỚ HỢP ĐỒNG CŨ
soHopDong.value = so || soHopDong.value // số hợp đồng GIỮ NGUYÊN

// ⚠️ KHÔNG dùng lại mã cũ
maHopDong.value = `HD${Date.now()}`


    // ghi chú (tolerant)
    ghiChuHopDong.value = String(row?.[16] ?? '').trim()

    // ====== load customer ======
    const maKH = String(row?.[2] ?? '').trim()
    if (maKH) {
      fillCustomerByMa(maKH) // sẽ set khach + maKHInput + tenKHInput
    } else {
      // fallback: set tên nếu có
      const tenKH = String(row?.[3] ?? '').trim()
      if (tenKH) fillCustomerByTen(tenKH)
    }

    // ====== detect currency mode (nếu row có 2 cột cuối donVi/tiGia) ======
    // buildHopDongTongQuatRow của mày đang return thêm: donVi, tiGia ở cuối
    const donViSaved = String(row?.[17] ?? '').trim()
    const tiGiaSaved = toNum(row?.[18], 1)
    // logic: nếu hóa đơn lưu "VND + ti_gia=1" => showVND = true
    // (mày đang dùng showVND để hiển thị VND)
    if (donViSaved === 'VND' && tiGiaSaved === 1) showVND.value = true
    else showVND.value = false

    // ====== load chi tiết ======
    const detailRows = await fetch(`${BASE_URL}?action=hop_dong_chi_tiet`).then(r => r.json())
    const all = Array.isArray(detailRows) ? detailRows : []
    const mine = all.filter((r: any[]) => String(r?.[0] ?? '').trim() === ma)

    // đổ vào selectedItems
    selectedItems.value = mine.map(mapHopDongChiTietRowToItem)

    // sync qtyMap (để card qty đúng nếu add tiếp)
    selectedItems.value.forEach(it => {
      if (it.Ma_hang) qtyMap[it.Ma_hang] = Math.max(1, toNum(it.So_luong, 1))
    })

    showLoadInvoiceModal.value = false
    loadKey.value = ''
    loadMsg.value = '✅ Đã load hóa đơn/hợp đồng lên FE.'
  } catch (e: any) {
    loadMsg.value = '❌ Lỗi load: ' + String(e?.message || e)
  } finally {
    loadingInvoice.value = false
  }
}

function unitPrice(i: any) {
  const dg = toNum(i.Don_gia, 0)
  const tg = toNum(i.Ti_gia, 1)
  return showVND.value ? dg * tg : dg
}

function standardPrice(i: any) {
  const gt = toNum(i.Gia_tieu_chuan, 0)
  const tg = toNum(i.Ti_gia, 1)
  return showVND.value ? gt * tg : gt
}

const quoteCurrency = computed(() => {
  if (showVND.value) return 'VND'
  return (selectedItems.value[0]?.Don_vi_tien_te || '').trim() || 'VND'
})
function onEditDonGiaVND(item: any, e: Event) {
  const vnd = Number((e.target as HTMLInputElement).value || 0)
  const tg = toNum(item.Ti_gia, 1)
  item.Don_gia = tg > 0 ? vnd / tg : vnd
}

function toNum(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

function cloneHang(h: HangHoa, qty = 1): HangHoa & { So_luong: number } {
  return {
    ...JSON.parse(JSON.stringify(h)),
    So_luong: Math.max(1, toNum(qty, 1))
  }
}
function unitPriceRaw(i: any) {
  return toNum(i.Don_gia, 0) // KHÔNG phụ thuộc showVND
}

function standardPriceRaw(i: any) {
  return toNum(i.Gia_tieu_chuan, 0) // KHÔNG phụ thuộc showVND
}

function lineTruocThueRaw(i: any) {
  return unitPriceRaw(i) * toNum(i.So_luong, 1)
}

function lineVATRaw(i: any) {
  return (lineTruocThueRaw(i) * toNum(i.Thue_VAT, 0)) / 100
}

function lineSauThueRaw(i: any) {
  return lineTruocThueRaw(i) + lineVATRaw(i)
}

function lineLoiNhuanRaw(i: any) {
  return (unitPriceRaw(i) - standardPriceRaw(i)) * toNum(i.So_luong, 1)
}

const totalsContract = computed(() => {
  let truoc = 0, vat = 0, loi = 0
  selectedItems.value.forEach(i => {
    truoc += lineTruocThueRaw(i)
    vat += lineVATRaw(i)
    loi += lineLoiNhuanRaw(i)
  })
  return { truoc, vat, sau: truoc + vat, loi }
})


/* ======================
   SAVE CONTRACT (POST no-cors)
====================== */
const saving = ref(false)
const saveMsg = ref('')

async function postNoCors(action: string, payload: any) {
  // no-cors: không đọc được response -> chỉ biết "gửi được request"
  const body = new URLSearchParams()
  body.set('action', action)
  body.set('payload', JSON.stringify(payload || {}))

  await fetch(BASE_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  })
}

/* ======================
   BUILD ROWS (đúng thứ tự sheet)
====================== */

/** hop_dong_tong_quat (17 cột)
 *  0 ma_hop_dong
 *  1 so_hop_dong
 *  2 ma_khach_hang
 *  3 ten_khach_hang
 *  4 ngay_tao_hop_dong
 *  5 Tong_tien_truoc_thueVAT
 *  6 Tong_thueVAT
 *  7 Tong_tien_sau_thueVAT
 *  8 Tong_giam_gia
 *  9 Tong_cong
 * 10 Tong_thanh_toan
 * 11 Tong_hoa_hong_khach_hang
 * 12 Tong_hoa_hong_ca_nhan
 * 13 Cong_no_cu
 * 14 Trang_thai_thanh_toan
 * 15 Trang_thai_hop_dong
 * 16 Ghi_chu
 */
function formatDateTimeVN(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const DD = pad(d.getDate())
  const MM = pad(d.getMonth() + 1)
  const YYYY = d.getFullYear()
  return `${hh}:${mm}:${ss} ${DD}/${MM}/${YYYY}`
}

function buildHopDongTongQuatRow(
  statusHopDong: 'Tạm' | 'Chính thức',
  maHopDongCu: string | null
) {

  const now = new Date()
  const ngay = formatDateTimeVN(new Date())


  // ✅ totals: theo showVND (có nhân tỉ giá)
  // ✅ totalsContract: RAW (giá gốc)
  const t = showVND.value ? totals.value : totalsContract.value

  const truoc = Math.round(t.truoc)
  const vat   = Math.round(t.vat)
  const sau   = Math.round(t.sau)

  const tongGiamGia = 0
  const tongCong = sau
  const tongThanhToan = 0
  const hhKhach = 0
  const hhCaNhan = 0
  const congNoCu = toNum(khach.value.Cong_no_chua_thanh_toan, 0)
  const trangThaiThanhToan = 'Chưa thanh toán đủ'
  const ghiChu = (ghiChuHopDong.value || '').trim()

  // ✅ nếu đang bật VND thì lưu VND + tiGia = 1
  const donVi = showVND.value
    ? 'VND'
    : (selectedItems.value[0]?.Don_vi_tien_te || 'VND').trim()

  const tiGia = showVND.value
    ? 1
    : toNum(selectedItems.value[0]?.Ti_gia, 1)

  return [
    maHopDong.value,
    soHopDong.value,
    (khach.value.Ma_khach_hang || '').trim(),
    (khach.value.Ten_khach_hang || '').trim(),
    ngay,
    truoc,
    vat,
    sau,
    tongGiamGia,
    tongCong,
    tongThanhToan,
    hhKhach,
    hhCaNhan,
    congNoCu,
    trangThaiThanhToan,
    statusHopDong,
    ghiChu,
    donVi,
    tiGia,
      maHopDongCu || ''     // ✅ CỘT MỚI
  ]
}


/** hop_dong_chi_tiet (18 cột)
 *  ma_hop_dong, so_hop_dong,
 *  Ma_hang, Ten_hang, Main_img,
 *  Ma_nha_cung_cap, Ten_nha_cung_cap,
 *  Mo_ta_chung, Mo_ta_chi_tiet, Features, Danh_muc,
 *  License_duration, DVT, Gia_tieu_chuan, Don_gia,
 *  Don_vi_tien_te, Ti_gia, Thue_VAT
 *
 *  (sheet này CHƯA có So_luong theo schema mày gửi)
 *  => nếu muốn lưu số lượng thì phải thêm cột So_luong trong sheet + update BE.
 */
function buildHopDongChiTietRows() {
  return selectedItems.value.map(it => {
    const tg = toNum(it.Ti_gia, 1)

    const donGiaToSave = showVND.value ? toNum(it.Don_gia, 0) * tg : toNum(it.Don_gia, 0)
    const giaTCToSave  = showVND.value ? toNum(it.Gia_tieu_chuan, 0) * tg : toNum(it.Gia_tieu_chuan, 0)

    return [
      maHopDong.value,
      soHopDong.value,
      it.Ma_hang || '',
      it.Ten_hang || '',
      it.Main_img || '',
      it.Ma_nha_cung_cap || '',
      it.Ten_nha_cung_cap || '',
      it.Mo_ta_chung || '',
      it.Mo_ta_chi_tiet || '',
      it.Features || '',
      it.Danh_muc || '',
      it.License_duration || '',
      it.DVT || '',
      giaTCToSave,                 // ✅ Gia_tieu_chuan
      donGiaToSave,                // ✅ Don_gia
      showVND.value ? 'VND' : (it.Don_vi_tien_te || 'VND').trim(),
      showVND.value ? 1 : toNum(it.Ti_gia, 1), // ✅ nếu lưu VND thì ti_gia=1
      toNum(it.Thue_VAT, 0),
      Math.max(1, toNum((it as any).So_luong, 1)),
      ''
    ]
  })
}


function canSaveContractBasic() {
  if (!selectedItems.value.length) return 'Chưa có hàng trong báo giá.'
  if (!khach.value.Ma_khach_hang?.trim()) return 'Chưa chọn Mã khách hàng.'
  if (!khach.value.Ten_khach_hang?.trim()) return 'Chưa có Tên khách hàng.'
  return ''
}
async function saveContractTemp() {
  saveMsg.value = ''
  const err = canSaveContractBasic()
  if (err) {
    saveMsg.value = err
    return
  }

  try {
    saving.value = true
const payload = {
  hd_tong_quat_row: buildHopDongTongQuatRow(
    'Tạm',
    loadedMaHopDong.value   // ✅ gắn mã cũ
  ),
  hd_chi_tiet_rows: buildHopDongChiTietRows()
}


    await postNoCors('save_contract_temp', payload)
    saveMsg.value = '✅ Đã gửi lưu Hợp đồng TẠM (no-cors).'

    // reset nhanh nếu muốn:
    // selectedItems.value = []
  } catch (e: any) {
    saveMsg.value = '❌ Lỗi gửi lưu tạm: ' + String(e?.message || e)
  } finally {
    saving.value = false
  }
}

async function saveContractOfficial() {
  saveMsg.value = ''
  const err = canSaveContractBasic()
  if (err) {
    saveMsg.value = err
    return
  }

  try {
    saving.value = true
    const tongSauThue = Math.round((showVND.value ? totals.value.sau : totalsContract.value.sau))


const payload = {
  hd_tong_quat_row: buildHopDongTongQuatRow(
    'Chính thức',
    loadedMaHopDong.value   // ✅ gắn mã cũ
  ),
  hd_chi_tiet_rows: buildHopDongChiTietRows(),
  ma_khach_hang: (khach.value.Ma_khach_hang || '').trim(),
  tong_sau_thue: tongSauThue
}

    await postNoCors('save_contract_official', payload)
    saveMsg.value = '✅ Đã gửi lưu Hợp đồng CHÍNH THỨC (no-cors).'
    loadedMaHopDong.value = null
  } catch (e: any) {
    saveMsg.value = '❌ Lỗi gửi lưu chính thức: ' + String(e?.message || e)
  } finally {
    saving.value = false
  }
}

/* BE trả về mảng -> map về object theo index (tolerant) */
function mapHangHoaRow(row: any[]): HangHoa {
  // Nếu sheet có Mo_ta_chi_tiet (>=20 cột): dùng mapping extended
  if (row.length >= 20) {
    return {
      Ma_hang: String(row[0] ?? ''),
      Ten_hang: String(row[1] ?? ''),
      Main_img: String(row[2] ?? ''),
      Ma_nha_cung_cap: String(row[3] ?? ''),
      Ten_nha_cung_cap: String(row[4] ?? ''),
      Mo_ta_chung: String(row[5] ?? ''),
      Mo_ta_chi_tiet: String(row[6] ?? ''),
      Features: String(row[7] ?? ''),
      Danh_muc: String(row[8] ?? ''),
      License_duration: String(row[9] ?? ''),
      DVT: String(row[10] ?? ''),
      Gia_tieu_chuan: toNum(row[11], 0),
      Don_gia: toNum(row[12], 0),
      Trang_thai: String(row[13] ?? ''),
      Don_vi_tien_te: String(row[14] ?? 'VND'),
      Ti_gia: toNum(row[15], 1),
      Thue_VAT: toNum(row[16], 0),
      Ma_hang_lien_ket: String(row[17] ?? ''),
      Ten_hang_lien_ket: String(row[18] ?? ''),
      Ghi_chu: String(row[19] ?? '')
    }
  }

  // Nếu sheet cũ (>=19 cột): không có Mo_ta_chi_tiet
  return {
    Ma_hang: String(row[0] ?? ''),
    Ten_hang: String(row[1] ?? ''),
    Main_img: String(row[2] ?? ''),
    Ma_nha_cung_cap: String(row[3] ?? ''),
    Ten_nha_cung_cap: String(row[4] ?? ''),
    Mo_ta_chung: String(row[5] ?? ''),
    Mo_ta_chi_tiet: '',
    Features: String(row[6] ?? ''),
    Danh_muc: String(row[7] ?? ''),
    License_duration: String(row[8] ?? ''),
    DVT: String(row[9] ?? ''),
    Gia_tieu_chuan: toNum(row[10], 0),
    Don_gia: toNum(row[11], 0),
    Trang_thai: String(row[12] ?? ''),
    Don_vi_tien_te: String(row[13] ?? 'VND'),
    Ti_gia: toNum(row[14], 1),
    Thue_VAT: toNum(row[15], 0),
    Ma_hang_lien_ket: String(row[16] ?? ''),
    Ten_hang_lien_ket: String(row[17] ?? ''),
    Ghi_chu: String(row[18] ?? '')
  }
}
const IDX_TIME = 4

const contractsSortedDesc = computed(() => {
  return [...contractsRaw.value].sort((a, b) => {
    const ta = String(a?.[IDX_TIME] ?? '')
    const tb = String(b?.[IDX_TIME] ?? '')
    // so sánh chuỗi vì cùng format trong sheet
    return tb.localeCompare(ta)
  })
})

function mapKhachRow(row: any[]): KhachHang {
  // khach_hang chuẩn A->P (16 cột)
  return {
    Ma_khach_hang: String(row[0] ?? ''),
    Ten_khach_hang: String(row[1] ?? ''),
    Email_ca_nhan: String(row[2] ?? ''),
    So_dien_thoai_ca_nhan: String(row[3] ?? ''),
    Ma_cong_ty: String(row[4] ?? ''),
    Ten_cong_ty: String(row[5] ?? ''),
    So_dien_thoai_cong_ty: String(row[6] ?? ''),
    So_fax_cong_ty: String(row[7] ?? ''),
    Dia_chi_cong_ty: String(row[8] ?? ''),
    Email_cong_ty: String(row[9] ?? ''),
    Website_cong_ty: String(row[10] ?? ''),
    Trang_thai: String(row[14] ?? ''),
    Cong_no_chua_thanh_toan: String(row[13] ?? ''),
    Ghi_chu: String(row[15] ?? '')
  }
}

/* ======================
   INIT
====================== */
onMounted(async () => {
  // hop_dong_tong_quat chỉ dùng count -> STT
const hdRows = await fetch(`${BASE_URL}?action=hop_dong_tong_quat`).then(r => r.json())
contractsRaw.value = Array.isArray(hdRows) ? hdRows : []
const hdLen = contractsRaw.value.length
soHopDong.value = `HĐ${hdLen + 1}`


  // hang_hoa
  const hhRows = await fetch(`${BASE_URL}?action=hang_hoa`).then(r => r.json())
  const mappedProducts = (Array.isArray(hhRows) ? hhRows : []).map(mapHangHoaRow)
  products.value = mappedProducts

  // init qtyMap
  mappedProducts.forEach(p => {
    if (!qtyMap[p.Ma_hang]) qtyMap[p.Ma_hang] = 1
  })

  // khach_hang
  const khRows = await fetch(`${BASE_URL}?action=khach_hang`).then(r => r.json())
  customers.value = (Array.isArray(khRows) ? khRows : []).map(mapKhachRow)
})

/* ======================
   AUTO FILL KHÁCH (theo mã hoặc tên)
====================== */
function fillCustomerByMa(val: string) {
  const found = customers.value.find(c => c.Ma_khach_hang === val)
  if (!found) return
  khach.value = JSON.parse(JSON.stringify(found))
  maKHInput.value = found.Ma_khach_hang
  tenKHInput.value = found.Ten_khach_hang
}

function fillCustomerByTen(val: string) {
  const found = customers.value.find(c => c.Ten_khach_hang === val)
  if (!found) return
  khach.value = JSON.parse(JSON.stringify(found))
  maKHInput.value = found.Ma_khach_hang
  tenKHInput.value = found.Ten_khach_hang
}

/* nếu user gõ tay rồi blur */
function onBlurMaKH() {
  if (maKHInput.value?.trim()) fillCustomerByMa(maKHInput.value.trim())
}
function onBlurTenKH() {
  if (tenKHInput.value?.trim()) fillCustomerByTen(tenKHInput.value.trim())
}

/* ======================
   AUTO FILL PRODUCT (manual modal)
====================== */
function autoFillProduct(val: string) {
  const v = (val || '').trim()
  if (!v) return
  const p = products.value.find(i => i.Ma_hang === v || i.Ten_hang === v)
  if (!p) return
  const keepQty = itemForm.value.So_luong
  itemForm.value = { ...JSON.parse(JSON.stringify(p)), So_luong: Math.max(1, toNum(keepQty, 1)) }
}

/* ======================
   FILTERS
====================== */
const supplierOptions = computed(() => {
  const set = new Set<string>()
  products.value.forEach(p => {
    const key = p.Ten_nha_cung_cap?.trim() || p.Ma_nha_cung_cap?.trim()
    if (key) set.add(key)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filteredProducts = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return products.value.filter(p => {
    const okKw =
      !kw ||
      p.Ma_hang?.toLowerCase().includes(kw) ||
      p.Ten_hang?.toLowerCase().includes(kw) ||
      p.Ten_nha_cung_cap?.toLowerCase().includes(kw)

    const okSupplier =
      supplierFilter.value === 'ALL' ||
      p.Ten_nha_cung_cap === supplierFilter.value ||
      p.Ma_nha_cung_cap === supplierFilter.value

    return okKw && okSupplier
  })
})

/* ======================
   CARD QTY realtime
====================== */
function incQty(ma: string) {
  qtyMap[ma] = Math.max(1, toNum(qtyMap[ma], 1) + 1)
}
function decQty(ma: string) {
  qtyMap[ma] = Math.max(1, toNum(qtyMap[ma], 1) - 1)
}

/* ======================
   ADD / RESET
====================== */
function addItemFromCard(p: HangHoa) {
  const qty = Math.max(1, qtyMap[p.Ma_hang] || 1)

  const found = selectedItems.value.find(
    it => it.Ma_hang === p.Ma_hang
  )

  if (found) {
    // ✅ đã có → cộng dồn số lượng
    found.So_luong += qty
  } else {
    // ✅ chưa có → thêm mới
    selectedItems.value.push(cloneHang(p, qty))
  }
}


function addItem(item: HangHoa & { So_luong: number }) {
  const found = selectedItems.value.find(
    it => it.Ma_hang === item.Ma_hang
  )

  if (found) {
    found.So_luong += Math.max(1, toNum(item.So_luong, 1))
  } else {
    selectedItems.value.push(JSON.parse(JSON.stringify(item)))
  }
}


function resetItem() {
  const keepCurrency = itemForm.value.Don_vi_tien_te || 'VND'
  itemForm.value = {
    Ma_hang: '',
    Ten_hang: '',
    Main_img: '',
    Ma_nha_cung_cap: '',
    Ten_nha_cung_cap: '',
    Mo_ta_chung: '',
    Mo_ta_chi_tiet: '',
    Features: '',
    Danh_muc: '',
    License_duration: '',
    DVT: '',
    Gia_tieu_chuan: 0,
    Don_gia: 0,
    Trang_thai: 'Hiển thị',
    Don_vi_tien_te: keepCurrency,
    Ti_gia: 1,
    Thue_VAT: 0,
    Ma_hang_lien_ket: '',
    Ten_hang_lien_ket: '',
    Ghi_chu: '',
    So_luong: 1
  }
}

function resetCustomer() {
  khach.value = {
    Ma_khach_hang: '',
    Ten_khach_hang: '',
    Email_ca_nhan: '',
    So_dien_thoai_ca_nhan: '',
    Ma_cong_ty: '',
    Ten_cong_ty: '',
    So_dien_thoai_cong_ty: '',
    So_fax_cong_ty: '',
    Dia_chi_cong_ty: '',
    Email_cong_ty: '',
    Website_cong_ty: '',
    Trang_thai: '',
    Cong_no_chua_thanh_toan: '',
    Ghi_chu: ''
  }
  maKHInput.value = ''
  tenKHInput.value = ''
}

/* ======================
   CARD MODAL (full fields)
====================== */
function openCardModal(p: HangHoa) {
  const qty = qtyMap[p.Ma_hang] || 1
  cardEdit.value = cloneHang(p, qty)
  showCardModal.value = true
}

function addFromCardModal() {
  if (!cardEdit.value) return

  const found = selectedItems.value.find(
    it => it.Ma_hang === cardEdit.value!.Ma_hang
  )

  if (found) {
    found.So_luong += Math.max(1, toNum(cardEdit.value.So_luong, 1))
  } else {
    selectedItems.value.push(JSON.parse(JSON.stringify(cardEdit.value)))
  }

  qtyMap[cardEdit.value.Ma_hang] = Math.max(1, toNum(cardEdit.value.So_luong, 1))
  showCardModal.value = false
}


/* ======================
   PREVIEW MODAL (quote)
   - editable like excel: qty, don_gia, VAT
====================== */
function ensureNumberField(item: any, key: string) {
  item[key] = toNum(item[key], 0)
}

function lineTruocThue(i: any) {
  return unitPrice(i) * toNum(i.So_luong, 1)
}

function lineVAT(i: any) {
  return (lineTruocThue(i) * toNum(i.Thue_VAT, 0)) / 100
}

function lineSauThue(i: any) {
  return lineTruocThue(i) + lineVAT(i)
}

function lineLoiNhuan(i: any) {
  return (unitPrice(i) - standardPrice(i)) * toNum(i.So_luong, 1)
}

function lineLoiNhuanPct(i: any) {
  const base = standardPrice(i)
  if (base <= 0) return ''
  return (((unitPrice(i) - base) / base) * 100).toFixed(2)
}

/* ======================
   TOTALS
====================== */
const totals = computed(() => {
  let truoc = 0,
    vat = 0,
    loi = 0

  selectedItems.value.forEach(i => {
    truoc += lineTruocThue(i)
    vat += lineVAT(i)
    loi += lineLoiNhuan(i)
  })

  return { truoc, vat, sau: truoc + vat, loi }
})

/* ======================
   PRICE DISPLAY
====================== */
function displayPrice(p: HangHoa) {
  if (showVND.value) {
    const vnd = toNum(p.Don_gia, 0) * toNum(p.Ti_gia, 1)
    return `${formatVND(vnd)} VND`
  }
  return `${formatVND(toNum(p.Don_gia, 0))} ${p.Don_vi_tien_te || ''}`.trim()
}

/* keep card qty stable when filter changes */
watch(
  () => products.value.length,
  () => {
    products.value.forEach(p => {
      if (!qtyMap[p.Ma_hang]) qtyMap[p.Ma_hang] = 1
    })
  }
)

/* ======================
   ✅ GROUPING FOR QUOTE MODAL
   - cùng NCC + cùng Danh_muc => thêm 1 dòng DANH MỤC
====================== */
type QuoteRow =
  | {
      type: 'group'
      key: string
      title: string
      roman: string
    }
  | {
      type: 'item'
      key: string
      item: HangHoa & { So_luong: number }
      idx: number
      stt?: number   // 👈 BẮT BUỘC
    }



const quoteRows = computed<QuoteRow[]>(() => {
  const rows: QuoteRow[] = []
  const seen = new Set<string>()
  let groupIndex = 0   // ✅ STT danh mục

  selectedItems.value.forEach((it, idx) => {
    const sup = (it.Ten_nha_cung_cap || it.Ma_nha_cung_cap || '').trim() || 'NCC'
    const cat = (it.Danh_muc || '').trim() || 'Danh mục'
    const gKey = `${sup}||${cat}`

    if (!seen.has(gKey)) {
      seen.add(gKey)
      groupIndex++

      rows.push({
        type: 'group',
        supplier: sup,
        category: cat,
        key: gKey,
        title: cat,
        roman: toRoman(groupIndex)   // ✅ THÊM
      } as any)
    }

    rows.push({ type: 'item', item: it, idx, key: `item-${idx}` })
  })

  return rows
})

/* ======================
   ✅ QUOTE EDIT MODAL (click row -> edit)
====================== */
const showQuoteEditModal = ref(false)
const quoteEdit = ref<(HangHoa & { So_luong: number }) | null>(null)
const quoteEditIdx = ref(-1)

function openQuoteEdit(idx: number) {
  const it = selectedItems.value[idx]
  if (!it) return
  quoteEdit.value = JSON.parse(JSON.stringify(it))
  quoteEditIdx.value = idx
  showQuoteEditModal.value = true
}

function closeQuoteEdit() {
  showQuoteEditModal.value = false
  quoteEdit.value = null
  quoteEditIdx.value = -1
}

function saveQuoteEdit() {
  if (!quoteEdit.value) return
  const idx = quoteEditIdx.value
  if (idx < 0) return

  // ép số an toàn
  quoteEdit.value.So_luong = Math.max(1, toNum(quoteEdit.value.So_luong, 1))
  quoteEdit.value.Don_gia = Math.max(0, toNum(quoteEdit.value.Don_gia, 0))
  quoteEdit.value.Gia_tieu_chuan = Math.max(0, toNum(quoteEdit.value.Gia_tieu_chuan, 0))
  quoteEdit.value.Ti_gia = Math.max(0, toNum(quoteEdit.value.Ti_gia, 1))
  quoteEdit.value.Thue_VAT = Math.max(0, toNum(quoteEdit.value.Thue_VAT, 0))

  // replace item -> totals tự tính lại vì totals là computed
  selectedItems.value[idx] = JSON.parse(JSON.stringify(quoteEdit.value))
  closeQuoteEdit()
}

function removeSelected(idx: number) {
  if (idx < 0 || idx >= selectedItems.value.length) return
  selectedItems.value.splice(idx, 1)

  // nếu đang edit đúng item bị xóa -> đóng
  if (quoteEditIdx.value === idx) {
    closeQuoteEdit()
    return
  }
  // nếu đang edit item phía sau -> shift index
  if (quoteEditIdx.value > idx) {
    quoteEditIdx.value -= 1
  }
}

/* sửa đơn giá khi đang bật mode VND */
function onEditQuoteDonGiaVND(e: Event) {
  if (!quoteEdit.value) return
  const vnd = Number((e.target as HTMLInputElement).value || 0)
  const tg = toNum(quoteEdit.value.Ti_gia, 1)
  quoteEdit.value.Don_gia = tg > 0 ? vnd / tg : vnd
}

/* hiển thị đơn giá trong bảng quote (không còn input) */
function displayQuoteDonGia(i: any) {
  if (showVND.value) return `${formatVND(toNum(i.Don_gia, 0) * toNum(i.Ti_gia, 1))} VND`
  const cur = (i.Don_vi_tien_te || '').trim() || 'VND'
  return `${formatVND(toNum(i.Don_gia, 0))} ${cur}`.trim()
}

async function loadCompareBySoHopDong(so: string) {
  compareDetails.value = []

  // 1️⃣ Lấy toàn bộ MÃ HĐ thuộc SỐ HĐ
  const maList = contractsRaw.value
    .filter(r => String(r?.[1] ?? '').trim() === so)
    .map(r => String(r?.[0] ?? '').trim())

  if (!maList.length) return

  // 2️⃣ Load toàn bộ chi tiết
  const detailRows = await fetch(`${BASE_URL}?action=hop_dong_chi_tiet`).then(r => r.json())
  const all = Array.isArray(detailRows) ? detailRows : []

  // 3️⃣ Lọc theo danh sách mã HĐ
  compareDetails.value = all.filter(r =>
    maList.includes(String(r?.[0] ?? '').trim())
  )
}
const compareSummary = computed(() => {
  let truoc = 0
  let tieuChuan = 0

  compareDetails.value.forEach(r => {
    const giaTC = toNum(r?.[13], 0)
    const donGia = toNum(r?.[14], 0)
    const sl = Math.max(1, toNum(r?.[18], 1))

    truoc += donGia * sl
    tieuChuan += giaTC * sl
  })

  const diff = truoc - tieuChuan
  const pct = tieuChuan > 0 ? (diff / tieuChuan) * 100 : 0

  return {
    truoc,
    tieuChuan,
    diff,
    pct
  }
})
const compareByProduct = computed(() => {
  const map = new Map<string, any>()

  compareDetails.value.forEach(r => {
    const ma = String(r?.[2] ?? '')
    const ten = String(r?.[3] ?? '')
    const giaTC = toNum(r?.[13], 0)
    const donGia = toNum(r?.[14], 0)
    const sl = Math.max(1, toNum(r?.[18], 1))

    if (!map.has(ma)) {
      map.set(ma, {
        Ma_hang: ma,
        Ten_hang: ten,
        truoc: 0,
        tieuChuan: 0
      })
    }

    const it = map.get(ma)
    it.truoc += donGia * sl
    it.tieuChuan += giaTC * sl
  })

  return Array.from(map.values()).map(it => {
    const diff = it.truoc - it.tieuChuan
    return {
      ...it,
      diff,
      pct: it.tieuChuan > 0 ? (diff / it.tieuChuan) * 100 : 0
    }
  })
})
const compareMaHopDongs = computed(() => {
  const set = new Set<string>()
  compareDetails.value.forEach(r => {
    const ma = String(r?.[0] ?? '').trim()
    if (ma) set.add(ma)
  })
  return Array.from(set)
})
const compareMatrix = computed(() => {
  const map = new Map<string, any>()

  compareDetails.value.forEach(r => {
    const maHD = String(r?.[0] ?? '').trim()
    const maHang = String(r?.[2] ?? '').trim()
    const tenHang = String(r?.[3] ?? '').trim()

    const giaTC = toNum(r?.[13], 0)
    const donGia = toNum(r?.[14], 0)
    const sl = Math.max(1, toNum(r?.[18], 1))

    if (!map.has(maHang)) {
      map.set(maHang, {
        Ma_hang: maHang,
        Ten_hang: tenHang,
        byHD: {}
      })
    }

    const row = map.get(maHang)

    if (!row.byHD[maHD]) {
      row.byHD[maHD] = { truoc: 0, tieuChuan: 0 }
    }

    row.byHD[maHD].truoc += donGia * sl
    row.byHD[maHD].tieuChuan += giaTC * sl
  })

  return Array.from(map.values()).map(r => {
    compareMaHopDongs.value.forEach(maHD => {
      const cell = r.byHD[maHD]
      if (!cell) {
        r.byHD[maHD] = null
      } else {
        const diff = cell.truoc - cell.tieuChuan
        r.byHD[maHD] = {
          diff,
          pct: cell.tieuChuan > 0 ? (diff / cell.tieuChuan) * 100 : 0
        }
      }
    })
    return r
  })
})
const compareByContract = computed(() => {
  const map = new Map<string, any>()

  compareDetails.value.forEach(r => {
    const maHD = String(r?.[0] ?? '').trim()

    const giaTC = toNum(r?.[13], 0)
    const donGia = toNum(r?.[14], 0)
    const sl = Math.max(1, toNum(r?.[18], 1))

    if (!map.has(maHD)) {
      map.set(maHD, {
        Ma_hop_dong: maHD,
        truoc: 0,
        tieuChuan: 0
      })
    }

    const it = map.get(maHD)
    it.truoc += donGia * sl
    it.tieuChuan += giaTC * sl
  })

  return Array.from(map.values()).map(it => {
    const diff = it.truoc - it.tieuChuan
    return {
      ...it,
      diff,
      pct: it.tieuChuan > 0 ? (diff / it.tieuChuan) * 100 : 0
    }
  })
})

import * as XLSX from 'xlsx'
function toRoman(num: number) {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ]
  let res = ''
  for (const [v, s] of map) {
    while (num >= v) {
      res += s
      num -= v
    }
  }
  return res
}

function buildExcelRows() {
  const rows: any[] = []

  // ===== HEADER =====
  rows.push([
    'STT',
    'TÊN HÀNG',
    'DIỄN GIẢI',
    'SL',
    'ĐVT',
    'ĐƠN GIÁ (VND)',
    'THÀNH TIỀN TRƯỚC THUẾ',
    'THUẾ VAT',
    'THÀNH TIỀN SAU THUẾ'
  ])

  let stt = 1

  quoteRows.value.forEach(r => {
    // ===== DÒNG DANH MỤC =====
if (r.type === 'group') {
  rows.push([
    r.roman,               // ✅ STT La Mã
    r.title.toUpperCase(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ])
  return
}


    const i = r.item

    const donGiaVND = showVND.value
      ? unitPrice(i)
      : unitPrice(i) * toNum(i.Ti_gia, 1)

    const truoc = lineTruocThue(i)
    const vat = lineVAT(i)
    const sau = lineSauThue(i)

    // ===== DÒNG ITEM =====
    rows.push([
      stt++,
      i.Ten_hang,
      [i.Mo_ta_chung, i.Mo_ta_chi_tiet, i.Features]
        .filter(Boolean)
        .join('\n'),
      i.So_luong,
      i.DVT,
      Math.round(donGiaVND),
      Math.round(truoc),
      Math.round(vat),
      Math.round(sau)
    ])
  })

  // ===== TỔNG CỘNG (CHỈ 1 LẦN) =====
  rows.push([
    '',
    'TỔNG CỘNG',
    '',
    '',
    '',
    '',
    Math.round(totals.value.truoc),
    Math.round(totals.value.vat),
    Math.round(totals.value.sau)
  ])

  return rows
}

function exportQuoteExcel() {
  const data = buildExcelRows()

  const ws = XLSX.utils.aoa_to_sheet(data)
  const range = XLSX.utils.decode_range(ws['!ref'] as string)

for (let r = range.s.r; r <= range.e.r; r++) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c })
    if (!ws[addr]) continue

    ws[addr].s = {
      ...(ws[addr].s || {}),
      border: {
        top:    { style: 'thin', color: { auto: 1 } },
        bottom: { style: 'thin', color: { auto: 1 } },
        left:   { style: 'thin', color: { auto: 1 } },
        right:  { style: 'thin', color: { auto: 1 } }
      }
    }
  }
}
for (let c = 0; c <= range.e.c; c++) {
  const addr = XLSX.utils.encode_cell({ r: 0, c })
  if (!ws[addr]) continue

  ws[addr].s = {
    ...(ws[addr].s || {}),
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: {
      fgColor: { rgb: 'CCFFCC' } // xanh nhạt như ảnh
    }
  }
}
for (let r = 1; r <= range.e.r; r++) {
  for (let c = 0; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c })
    if (!ws[addr]) continue

    // mặc định
    let align: any = { vertical: 'top' }

    // STT, SL, ĐVT
    if ([0, 3, 4].includes(c)) {
      align.horizontal = 'center'
    }
    // tiền
    else if (c >= 5) {
      align.horizontal = 'right'
    }
    // diễn giải
    else if (c === 2) {
      align.horizontal = 'left'
      align.wrapText = true
    }
    else {
      align.horizontal = 'left'
    }

    ws[addr].s = {
      ...(ws[addr].s || {}),
      alignment: align
    }
  }
}
data.forEach((row, idx) => {
  if (/^[IVXLCDM]+$/.test(String(row[0] || ''))) {
    const cell = ws[XLSX.utils.encode_cell({ r: idx, c: 1 })]
    if (cell) {
      cell.s = {
        ...(cell.s || {}),
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6F3FF' } } // xanh nhạt
      }
    }
  }
})
data.forEach((row, idx) => {
  if (row[1] === 'TỔNG CỘNG') {
    for (let c = 0; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: idx, c })
      if (!ws[addr]) continue

      ws[addr].s = {
        ...(ws[addr].s || {}),
        font: { bold: true },
        alignment: { horizontal: 'center' }
      }
    }
  }
})

  // ===== MERGE DÒNG DANH MỤC =====
  const merges: XLSX.Range[] = []
  data.forEach((r, idx) => {
    if (!r[0] && r[1] && r[1] !== 'TỔNG CỘNG') {
      merges.push({
        s: { r: idx, c: 1 },
        e: { r: idx, c: 8 }
      })
    }
  })
  ws['!merges'] = merges

  // ===== ĐỘ RỘNG CỘT =====
  ws['!cols'] = [
    { wch: 6 },   // STT
    { wch: 28 },  // Tên hàng
    { wch: 48 },  // Diễn giải
    { wch: 6 },   // SL
    { wch: 8 },   // ĐVT
    { wch: 18 },  // Đơn giá
    { wch: 22 },  // Trước thuế
    { wch: 18 },  // VAT
    { wch: 22 }   // Sau thuế
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'BaoGia')

  const fileName = `BaoGia_${soHopDong.value || maHopDong.value}.xlsx`
  XLSX.writeFile(wb, fileName)
}
const quoteRowsWithSTT = computed(() => {
  let stt = 0

  return quoteRows.value.map(r => {
    if (r.type === 'group') {
      stt = 0
      return r
    }

    // r.type === 'item'
    stt++

    return {
      ...r,
      stt
    }
  })
})

</script>

<template>
  <div class="page">
    <div class="main-grid">
      <!-- ================== LEFT SIDEBAR: KHÁCH ================== -->
      <aside class="sidebar sidebar-left" :class="{ closed: !showCustomerSidebar }">
        <div class="sidebar-head">
          <h3>👤 Khách hàng</h3>
          <button class="icon-btn" @click="showCustomerSidebar = false">✕</button>
        </div>

        <label>Mã khách hàng</label>
        <input
          v-model="maKHInput"
          list="dl-ma-kh"
          placeholder="Chọn / nhập mã KH"
          @change="fillCustomerByMa(maKHInput)"
          @blur="onBlurMaKH"
        />
        <datalist id="dl-ma-kh">
          <option v-for="k in customers" :key="k.Ma_khach_hang" :value="k.Ma_khach_hang" />
        </datalist>

        <label>Tên khách hàng</label>
        <input
          v-model="tenKHInput"
          list="dl-ten-kh"
          placeholder="Chọn / nhập tên KH"
          @change="fillCustomerByTen(tenKHInput)"
          @blur="onBlurTenKH"
        />
        <datalist id="dl-ten-kh">
          <option v-for="k in customers" :key="k.Ma_khach_hang + '_' + k.Ten_khach_hang" :value="k.Ten_khach_hang" />
        </datalist>

        <label>Email cá nhân</label>
        <input v-model="khach.Email_ca_nhan" placeholder="Email cá nhân" />

        <label>Số điện thoại cá nhân</label>
        <input v-model="khach.So_dien_thoai_ca_nhan" placeholder="SĐT cá nhân" />

        <label>Mã công ty</label>
        <input v-model="khach.Ma_cong_ty" placeholder="Mã công ty" />

        <label>Tên công ty</label>
        <input v-model="khach.Ten_cong_ty" placeholder="Tên công ty" />

        <label>SĐT công ty</label>
        <input v-model="khach.So_dien_thoai_cong_ty" placeholder="SĐT công ty" />

        <label>Số fax công ty</label>
        <input v-model="khach.So_fax_cong_ty" placeholder="Fax công ty" />

        <label>Địa chỉ công ty</label>
        <input v-model="khach.Dia_chi_cong_ty" placeholder="Địa chỉ công ty" />

        <label>Email công ty</label>
        <input v-model="khach.Email_cong_ty" placeholder="Email công ty" />

        <label>Website công ty</label>
        <input v-model="khach.Website_cong_ty" placeholder="Website công ty" />

        <label>Trạng thái</label>
        <input v-model="khach.Trang_thai" placeholder="Trạng thái" />

        <label>Công nợ chưa thanh toán</label>
        <input v-model="khach.Cong_no_chua_thanh_toan" placeholder="Công nợ" />

        <label>Ghi chú</label>
        <textarea v-model="khach.Ghi_chu" placeholder="Ghi chú" />

        <button @click="resetCustomer">Reset khách</button>
      </aside>

      <!-- NÚT MỞ SIDEBAR KHÁCH -->
      <button v-if="!showCustomerSidebar" class="open-tab left" @click="showCustomerSidebar = true">
        👤 Khách
      </button>

      <!-- ================== CENTER: SEARCH + CARDS ================== -->
      <section class="box center">
        <div class="top-bar">
          <button class="primary" @click="showManualModal = true">➕ Nhập tay</button>

          <input v-model="keyword" placeholder="Tìm mã / tên hàng / NCC..." />

          <select v-model="supplierFilter" class="select">
            <option value="ALL">Tất cả NCC</option>
            <option v-for="s in supplierOptions" :key="s" :value="s">{{ s }}</option>
          </select>

          <button class="ghost" @click="showVND = !showVND">
            {{ showVND ? 'Quay lại ' : 'Đổi hàng USD = > VND' }}
          </button>
        </div>

        <div class="product-grid">
          <div class="card" v-for="p in filteredProducts" :key="p.Ma_hang" @click="openCardModal(p)">
            <img :src="p.Main_img" />
            <h4 class="clamp2">{{ p.Ten_hang }}</h4>

            <p class="muted clamp2">{{ p.License_duration }}</p>
            <p class="clamp2">{{ p.Mo_ta_chung }}</p>

            <p class="price">
              {{ displayPrice(p) }} <span class="muted">/ {{ p.DVT }}</span>
            </p>

            <p class="muted">VAT: {{ p.Thue_VAT }}%</p>

            <div class="qty" @click.stop>
              <button @click="decQty(p.Ma_hang)">-</button>
              <span>{{ qtyMap[p.Ma_hang] || 1 }}</span>
              <button @click="incQty(p.Ma_hang)">+</button>
            </div>

            <button class="btn-add" @click.stop="addItemFromCard(p)">Thêm vào báo giá</button>
          </div>
        </div>
      </section>

      <!-- ================== RIGHT SIDEBAR: HỢP ĐỒNG + THAO TÁC ================== -->
      <aside class="sidebar sidebar-right" :class="{ closed: !showContractSidebar }">
        <div class="sidebar-head">
          <h3>📄 Hợp đồng</h3>
          <button class="icon-btn" @click="showContractSidebar = false">✕</button>
        </div>

        <label>Mã hợp đồng</label>
        <input v-model="maHopDong" readonly />

        <label>Số hợp đồng</label>
        <input v-model="soHopDong" readonly />

        <label>Ghi chú hợp đồng</label>
<textarea v-model="ghiChuHopDong" placeholder="Nhập ghi chú cho hợp đồng..." />

        <hr />

        <h3>⚙️ Thao tác</h3>

        <button class="primary" @click="showPreviewModal = true">Xem báo giá</button>
        <button class="primary" @click="exportQuoteExcel">
  Xuất Excel
</button>

        <button disabled>Xuất Word</button>
        <button disabled>Xuất PDF</button>
        <button :disabled="saving" @click="saveContractTemp">
  {{ saving ? 'Đang lưu...' : 'Lưu hợp đồng tạm' }}
</button>

<button class="primary" :disabled="saving" @click="saveContractOfficial">
  {{ saving ? 'Đang lưu...' : 'Lưu hợp đồng chính thức' }}
</button>

<p v-if="saveMsg" class="muted" style="margin-top:6px">{{ saveMsg }}</p>
<button class="ghost" @click="showLoadInvoiceModal = true">📥 Load hóa đơn</button>

<button class="ghost" @click="showPickCompareModal = true">
  📊 Xem bảng so sánh
</button>



        <div class="totals">
          <div class="mini"><b>Tổng trước thuế:</b> {{ formatVND(totals.truoc) }}</div>
          <div class="mini"><b>Tổng VAT:</b> {{ formatVND(totals.vat) }}</div>
          <div class="mini"><b>Tổng sau thuế:</b> {{ formatVND(totals.sau) }}</div>
          <div class="mini"><b>Tổng lợi nhuận:</b> {{ formatVND(totals.loi) }}</div>
        </div>
      </aside>

      <!-- NÚT MỞ SIDEBAR HỢP ĐỒNG -->
      <button v-if="!showContractSidebar" class="open-tab right" @click="showContractSidebar = true">
        📄 HĐ
      </button>
    </div>

    <!-- ================== MODAL: NHẬP TAY (FULL FIELDS) ================== -->
    <div v-if="showManualModal" class="modal" @click.self="showManualModal = false">
      <div class="modal-card modal-wide">
        <div class="modal-head">
          <h3>➕ Nhập tay hàng (đầy đủ field)</h3>
          <button class="x" @click="showManualModal = false">✕</button>
        </div>

        <div class="grid2">
          <div>
            <label>Mã hàng</label>
            <input v-model="itemForm.Ma_hang" list="dl-hh-ma" placeholder="Mã hàng" @blur="autoFillProduct(itemForm.Ma_hang)" />
            <datalist id="dl-hh-ma">
              <option v-for="p in products" :key="p.Ma_hang" :value="p.Ma_hang" />
            </datalist>
          </div>

          <div>
            <label>Tên hàng</label>
            <input v-model="itemForm.Ten_hang" list="dl-hh-ten" placeholder="Tên hàng" @blur="autoFillProduct(itemForm.Ten_hang)" />
            <datalist id="dl-hh-ten">
              <option v-for="p in products" :key="p.Ma_hang + '_t'" :value="p.Ten_hang" />
            </datalist>
          </div>
        </div>

        <label>Main_img (URL)</label>
        <input v-model="itemForm.Main_img" placeholder="https://..." />
        <img v-if="itemForm.Main_img" class="preview" :src="itemForm.Main_img" />

        <div class="grid2">
          <div>
            <label>Mã NCC</label>
            <input v-model="itemForm.Ma_nha_cung_cap" placeholder="Mã nhà cung cấp" />
          </div>
          <div>
            <label>Tên NCC</label>
            <input v-model="itemForm.Ten_nha_cung_cap" placeholder="Tên nhà cung cấp" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Mã hàng liên kết</label>
            <input v-model="itemForm.Ma_hang_lien_ket" placeholder="Mã hàng liên kết" />
          </div>
          <div>
            <label>Tên hàng liên kết</label>
            <input v-model="itemForm.Ten_hang_lien_ket" placeholder="Tên hàng liên kết" />
          </div>
        </div>

        <label>Mô tả chung</label>
        <textarea v-model="itemForm.Mo_ta_chung" placeholder="Mô tả chung" />

        <label>Mô tả chi tiết</label>
        <textarea v-model="itemForm.Mo_ta_chi_tiet" placeholder="Mô tả chi tiết" />

        <label>Features</label>
        <textarea v-model="itemForm.Features" placeholder="Features" />

        <div class="grid2">
          <div>
            <label>Danh mục</label>
            <input v-model="itemForm.Danh_muc" placeholder="Danh mục" />
          </div>
          <div>
            <label>License duration</label>
            <input v-model="itemForm.License_duration" placeholder="License duration" />
          </div>
        </div>

        <div class="grid3">
          <div>
            <label>ĐVT</label>
            <input v-model="itemForm.DVT" placeholder="ĐVT" />
          </div>
          <div>
            <label>Giá tiêu chuẩn</label>
            <input type="number" v-model.number="itemForm.Gia_tieu_chuan" placeholder="Giá tiêu chuẩn" />
          </div>
          <div>
            <label>Đơn giá</label>
            <input type="number" v-model.number="itemForm.Don_gia" placeholder="Đơn giá" />
          </div>
        </div>

        <div class="grid3">
          <div>
            <label>Đơn vị tiền tệ</label>
            <input v-model="itemForm.Don_vi_tien_te" placeholder="VND/USD/..." />
          </div>
          <div>
            <label>Tỉ giá</label>
            <input type="number" v-model.number="itemForm.Ti_gia" placeholder="Tỉ giá" />
          </div>
          <div>
            <label>Thuế VAT (%)</label>
            <input type="number" v-model.number="itemForm.Thue_VAT" placeholder="VAT" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Trạng thái</label>
            <input v-model="itemForm.Trang_thai" placeholder="Hiển thị / Ẩn" />
          </div>
          <div>
            <label>Số lượng</label>
            <input type="number" v-model.number="itemForm.So_luong" placeholder="Số lượng" />
          </div>
        </div>

        <label>Ghi chú</label>
        <textarea v-model="itemForm.Ghi_chu" placeholder="Ghi chú" />

        <div class="modal-actions">
          <button class="primary" @click="addItem(itemForm)">Thêm vào báo giá</button>
          <button @click="resetItem">Reset</button>
          <button @click="showManualModal = false">Đóng</button>
        </div>
      </div>
    </div>

    <!-- ================== MODAL: CARD DETAIL (FULL FIELDS) ================== -->
    <div v-if="showCardModal && cardEdit" class="modal" @click.self="showCardModal = false">
      <div class="modal-card modal-wide">
        <div class="modal-head">
          <h3>🧾 Chi tiết hàng (có thể chỉnh sửa)</h3>
          <button class="x" @click="showCardModal = false">✕</button>
        </div>

        <img v-if="cardEdit.Main_img" class="preview" :src="cardEdit.Main_img" />

        <div class="grid2">
          <div>
            <label>Mã hàng</label>
            <input v-model="cardEdit.Ma_hang" readonly />
          </div>
          <div>
            <label>Tên hàng</label>
            <input v-model="cardEdit.Ten_hang" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Mã NCC</label>
            <input v-model="cardEdit.Ma_nha_cung_cap" />
          </div>
          <div>
            <label>Tên NCC</label>
            <input v-model="cardEdit.Ten_nha_cung_cap" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Mã hàng liên kết</label>
            <input v-model="cardEdit.Ma_hang_lien_ket" />
          </div>
          <div>
            <label>Tên hàng liên kết</label>
            <input v-model="cardEdit.Ten_hang_lien_ket" />
          </div>
        </div>

        <label>Mô tả chung</label>
        <textarea v-model="cardEdit.Mo_ta_chung" />

        <label>Mô tả chi tiết</label>
        <textarea v-model="cardEdit.Mo_ta_chi_tiet" />

        <label>Features</label>
        <textarea v-model="cardEdit.Features" />

        <div class="grid2">
          <div>
            <label>Danh mục</label>
            <input v-model="cardEdit.Danh_muc" />
          </div>
          <div>
            <label>License duration</label>
            <input v-model="cardEdit.License_duration" />
          </div>
        </div>

        <div class="grid3">
          <div>
            <label>ĐVT</label>
            <input v-model="cardEdit.DVT" />
          </div>
          <div>
            <label>Giá tiêu chuẩn</label>
            <input type="number" v-model.number="cardEdit.Gia_tieu_chuan" />
          </div>
          <div>
            <label>Đơn giá</label>
            <input type="number" v-model.number="cardEdit.Don_gia" />
          </div>
        </div>

        <div class="grid3">
          <div>
            <label>Đơn vị tiền tệ</label>
            <input v-model="cardEdit.Don_vi_tien_te" />
          </div>
          <div>
            <label>Tỉ giá</label>
            <input type="number" v-model.number="cardEdit.Ti_gia" />
          </div>
          <div>
            <label>Thuế VAT (%)</label>
            <input type="number" v-model.number="cardEdit.Thue_VAT" />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label>Trạng thái</label>
            <input v-model="cardEdit.Trang_thai" />
          </div>
          <div>
            <label>Số lượng</label>
            <input type="number" v-model.number="cardEdit.So_luong" />
          </div>
        </div>

        <label>Ghi chú</label>
        <textarea v-model="cardEdit.Ghi_chu" />

        <div class="modal-actions">
          <button class="primary" @click="addFromCardModal">Thêm vào báo giá</button>
          <button @click="showCardModal = false">Đóng</button>
        </div>
      </div>
    </div>

    <!-- ================== MODAL: XEM BÁO GIÁ (GROUP THEO NCC + DANH MỤC) ================== -->
    <div v-if="showPreviewModal" class="modal" @click.self="showPreviewModal = false">
      <div class="modal-card modal-wide modal-quote">
        <div class="modal-head">
          <h3>📄 Báo giá</h3>
          <button class="x" @click="showPreviewModal = false">✕</button>
        </div>

        <div class="hint">Click vào ô <b>SL / Đơn giá / VAT</b> để sửa như Excel (tự tính lại ngay).</div>

        <div class="quote-table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-stt">STT</th>
                <th class="col-name">Tên hàng</th>
                <th class="col-desc">Diễn giải</th>
                <th class="col-sl">SL</th>
                <th class="col-dvt">ĐVT</th>
                <th class="col-dg">Đơn giá</th>
                <th class="col-tt">TT trước thuế</th>
                <th class="col-vat">VAT</th>
                <th class="col-tt">TT sau thuế</th>
                <th class="col-loi">Lợi nhuận</th>
                <th class="col-del">Xóa</th>

              </tr>
            </thead>

           <tbody>
  <template v-for="r in quoteRowsWithSTT" :key="r.key">

    <!-- ====== GROUP ROW: DANH MỤC ====== -->
  <tr v-if="r.type === 'group'" class="group-row">
 <td class="group-stt">{{ r.roman }}</td>
<td colspan="10" class="group-title">
  {{ r.title }}
</td>

</tr>



    <!-- ====== ITEM ROW (CLICK -> OPEN EDIT MODAL) ====== -->
    <tr v-else class="quote-item-row" @click="openQuoteEdit(r.idx)">
      <td>{{ r.stt }}</td>


      <td class="nowrap">
        {{ r.item.Ten_hang }}
      </td>

      <td class="desc">
        <div class="preline">
          <div v-if="r.item.Mo_ta_chung">{{ r.item.Mo_ta_chung }}</div>
          <div v-if="r.item.Mo_ta_chi_tiet">{{ r.item.Mo_ta_chi_tiet }}</div>
          <div v-if="r.item.Features">{{ r.item.Features }}</div>
        </div>
      </td>

      <!-- SL: chỉ hiển thị -->
      <td class="center">{{ r.item.So_luong }}</td>

      <td class="dvt">
        {{ r.item.DVT }}
      </td>

      <!-- Đơn giá: chỉ hiển thị (theo mode VND / giá gốc) -->
      <td class="right">
        {{ displayQuoteDonGia(r.item) }}
      </td>

      <td class="right">{{ formatVND(lineTruocThue(r.item)) }}</td>

      <!-- VAT: chỉ hiển thị -->
      <td class="center">{{ toNum(r.item.Thue_VAT, 0) }}%</td>

      <td class="right">{{ formatVND(lineSauThue(r.item)) }}</td>

      <td class="right">
        {{ formatVND(lineLoiNhuan(r.item)) }}
        <span class="muted" v-if="lineLoiNhuanPct(r.item)"> ({{ lineLoiNhuanPct(r.item) }}%)</span>
      </td>

      <!-- XÓA NHANH: click.stop để không mở modal -->
      <td class="center">
        <button class="btn-del" @click.stop="removeSelected(r.idx)">🗑</button>
      </td>
    </tr>
  </template>
</tbody>

          </table>
        </div>

        <div class="totals totals-quote">
          <div class="mini"><b>Tổng trước thuế:</b> {{ formatVND(totals.truoc) }}</div>
          <div class="mini"><b>Tổng VAT:</b> {{ formatVND(totals.vat) }}</div>
          <div class="mini"><b>Tổng sau thuế:</b> {{ formatVND(totals.sau) }}</div>
          <div class="mini"><b>Tổng lợi nhuận:</b> {{ formatVND(totals.loi) }}</div>
        </div>

        <div class="modal-actions">
          <button class="primary" @click="showPreviewModal = false">Đóng</button>
        </div>
      </div>
      <!-- ================== MODAL: CHỈNH SỬA ITEM BÁO GIÁ ================== -->
<div v-if="showQuoteEditModal && quoteEdit" class="modal" @click.self="closeQuoteEdit()">
  <div class="modal-card modal-wide">
    <div class="modal-head">
      <h3>✏️ Chỉnh sửa hàng trong báo giá</h3>
      <button class="x" @click="closeQuoteEdit()">✕</button>
    </div>

    <div class="grid2">
      <div>
        <label>Mã hàng</label>
        <input v-model="quoteEdit.Ma_hang" readonly />
      </div>
      <div>
        <label>Tên hàng</label>
        <input v-model="quoteEdit.Ten_hang" readonly />
      </div>
    </div>

    <div class="grid3">
      <div>
        <label>Số lượng</label>
        <input
          type="number"
          v-model.number="quoteEdit.So_luong"
          @input="ensureNumberField(quoteEdit, 'So_luong')"
          min="1"
        />
      </div>

      <div>
        <label>VAT (%)</label>
        <input
          type="number"
          v-model.number="quoteEdit.Thue_VAT"
          @input="ensureNumberField(quoteEdit, 'Thue_VAT')"
          min="0"
        />
      </div>

      <div>
        <label>Đơn vị (ĐVT)</label>
        <input v-model="quoteEdit.DVT" readonly />
      </div>
    </div>

    <div class="grid3">
      <div>
        <label>Đơn vị tiền tệ</label>
        <input v-model="quoteEdit.Don_vi_tien_te" readonly />
      </div>

      <div>
        <label>Tỉ giá</label>
        <input
          type="number"
          v-model.number="quoteEdit.Ti_gia"
          @input="ensureNumberField(quoteEdit, 'Ti_gia')"
          min="0"
        />
      </div>

      <div>
        <label>Đơn giá ({{ showVND ? 'VND' : (quoteEdit.Don_vi_tien_te || 'VND') }})</label>

        <!-- Giá gốc -->
        <input
          v-if="!showVND"
          type="number"
          v-model.number="quoteEdit.Don_gia"
          @input="ensureNumberField(quoteEdit, 'Don_gia')"
          min="0"
        />

        <!-- Giá VND -->
        <input
          v-else
          type="number"
          :value="toNum(quoteEdit.Don_gia, 0) * toNum(quoteEdit.Ti_gia, 1)"
          @input="onEditQuoteDonGiaVND($event)"
          min="0"
        />
      </div>
    </div>

    <hr />

    <!-- preview tính toán -->
    <div class="totals">
      <div class="mini"><b>Trước thuế:</b> {{ formatVND(lineTruocThue(quoteEdit)) }}</div>
      <div class="mini"><b>VAT:</b> {{ formatVND(lineVAT(quoteEdit)) }}</div>
      <div class="mini"><b>Sau thuế:</b> {{ formatVND(lineSauThue(quoteEdit)) }}</div>
      <div class="mini">
        <b>Lợi nhuận:</b> {{ formatVND(lineLoiNhuan(quoteEdit)) }}
        <span class="muted" v-if="lineLoiNhuanPct(quoteEdit)"> ({{ lineLoiNhuanPct(quoteEdit) }}%)</span>
      </div>
    </div>

    <div class="modal-actions">
      <button class="primary" @click="saveQuoteEdit()">Lưu</button>
      <button @click="closeQuoteEdit()">Hủy</button>
      <button class="btn-del" @click="removeSelected(quoteEditIdx)">🗑 Xóa item</button>
    </div>
  </div>
</div>

    </div>

    <!-- ================== MODAL: LOAD HÓA ĐƠN / HỢP ĐỒNG ================== -->
<div v-if="showLoadInvoiceModal" class="modal" @click.self="showLoadInvoiceModal = false">
  <div class="modal-card" style="width:min(560px,96vw)">
    <div class="modal-head">
      <h3>📥 Load hóa đơn / hợp đồng</h3>
      <button class="x" @click="showLoadInvoiceModal = false">✕</button>
    </div>

    <div class="grid2">
      <div>
        <label>Chọn theo</label>
        <select v-model="loadMode">
          <option value="SO">Số hợp đồng</option>
          <option value="MA">Mã hợp đồng</option>
        </select>
      </div>

      <div>
        <label>{{ loadMode === 'SO' ? 'Nhập/chọn Số hợp đồng' : 'Nhập/chọn Mã hợp đồng' }}</label>

        <input
          v-model="loadKey"
          :list="loadMode === 'SO' ? 'dl-so-hd' : 'dl-ma-hd'"
          placeholder="Chọn từ danh sách hoặc nhập tay..."
        />

<datalist id="dl-so-hd">
  <option
    v-for="r in contractsSortedDesc"
    :key="'so-' + r[1]"
    :value="String(r?.[1] ?? '').trim()"
  >
    {{ String(r?.[1] ?? '').trim() }}
    -
    {{ String(r?.[0] ?? '').trim() }}
    -
    {{ String(r?.[IDX_TIME] ?? '').trim() }}
  </option>
</datalist>


<datalist id="dl-ma-hd">
  <option
    v-for="r in contractsSortedDesc"
    :key="'ma-' + r[0]"
    :value="String(r?.[0] ?? '').trim()"
  >
    {{ String(r?.[0] ?? '').trim() }}
    -
    {{ String(r?.[1] ?? '').trim() }}
    -
    {{ String(r?.[IDX_TIME] ?? '').trim() }}
  </option>
</datalist>


      </div>
    </div>

    <p v-if="loadMsg" class="muted" style="margin-top:6px">{{ loadMsg }}</p>

    <div class="modal-actions">
      <button class="primary" :disabled="loadingInvoice" @click="loadInvoiceToFE">
        {{ loadingInvoice ? 'Đang load...' : 'Load vào FE' }}
      </button>
      <button @click="showLoadInvoiceModal = false">Đóng</button>
    </div>
  </div>
</div>


<!-- ================== MODAL: CHỌN SỐ HỢP ĐỒNG SO SÁNH ================== -->
<div v-if="showPickCompareModal" class="modal" @click.self="showPickCompareModal = false">
  <div class="modal-card" style="width:min(520px,96vw)">
    <div class="modal-head">
      <h3>📊 Chọn SỐ hợp đồng để so sánh</h3>
      <button class="x" @click="showPickCompareModal = false">✕</button>
    </div>

    <label>Số hợp đồng</label>
    <input
      v-model="pickCompareSo"
      list="dl-compare-so"
      placeholder="VD: HĐ9"
    />

    <datalist id="dl-compare-so">
      <option
        v-for="r in contractsSortedDesc"
        :key="'cmp-' + r[1]"
        :value="String(r?.[1] ?? '').trim()"
      >
        {{ String(r?.[1] ?? '').trim() }}
        -
        {{ String(r?.[0] ?? '').trim() }}
        -
        {{ String(r?.[IDX_TIME] ?? '').trim() }}
      </option>
    </datalist>

    <div class="modal-actions">
      <button
        class="primary"
        :disabled="!pickCompareSo"
        @click="
          compareSoHopDong = pickCompareSo;
          loadCompareBySoHopDong(pickCompareSo);
          showPickCompareModal = false;
          showCompareModal = true;
        "
      >
        So sánh
      </button>
      <button @click="showPickCompareModal = false">Hủy</button>
    </div>
  </div>
</div>

<!-- ================== MODAL: BẢNG SO SÁNH ================== -->
<div v-if="showCompareModal" class="modal" @click.self="showCompareModal = false">
  <div class="modal-card modal-wide">
    <div class="modal-head">
      <h3>📊 So sánh hợp đồng – {{ compareSoHopDong }}</h3>
      <button class="x" @click="showCompareModal = false">✕</button>
    </div>

    <!-- ===== TỔNG HÓA ĐƠN ===== -->
   <h4>🔹 So sánh tổng hóa đơn (theo mã hợp đồng)</h4>

<table>
  <thead>
    <tr>
      <th>Mã hợp đồng</th>
      <th class="right">Tổng trước thuế</th>
      <th class="right">Tổng tiêu chuẩn</th>
      <th class="right">Chênh lệch</th>
      <th class="right">%</th>
    </tr>
  </thead>

  <tbody>
    <tr v-for="r in compareByContract" :key="r.Ma_hop_dong">
      <td>{{ r.Ma_hop_dong }}</td>

      <td class="right">{{ formatVND(r.truoc) }}</td>
      <td class="right">{{ formatVND(r.tieuChuan) }}</td>

      <td
        class="right"
        :style="{ color: r.diff >= 0 ? 'green' : 'red' }"
      >
        {{ formatVND(r.diff) }}
      </td>

      <td class="right">{{ r.pct.toFixed(2) }}%</td>
    </tr>
  </tbody>
</table>




    <hr />

    <!-- ===== THEO MÃ HÀNG ===== -->
   
   <h4>🔹 So sánh mã hàng </h4>

<table>
  <thead>
    <tr>
      <th>Mã hàng</th>
      <th>Tên hàng</th>
      <th v-for="maHD in compareMaHopDongs" :key="maHD">
        {{ maHD }}
      </th>
    </tr>
  </thead>

  <tbody>
    <tr v-for="r in compareMatrix" :key="r.Ma_hang">
      <td>{{ r.Ma_hang }}</td>
      <td>{{ r.Ten_hang }}</td>

      <td
        v-for="maHD in compareMaHopDongs"
        :key="maHD"
        class="right"
        :style="{
          color: r.byHD[maHD]?.diff >= 0 ? 'green' : 'red'
        }"
      >
        <template v-if="r.byHD[maHD]">
          {{ formatVND(r.byHD[maHD].diff) }}
          <span class="muted">
            ({{ r.byHD[maHD].pct.toFixed(2) }}%)
          </span>
        </template>
        <template v-else>—</template>
      </td>
    </tr>
  </tbody>
</table>


    <div class="modal-actions">
      <button class="primary" @click="showCompareModal = false">Đóng</button>
    </div>
  </div>
</div>

  </div>
</template>

<style scoped>
/* ===== PAGE ===== */
.page {
  padding: 16px;
  background: #f5f7fb;
  min-height: 100vh;
}

/* ===== MAIN GRID ===== */
.main-grid {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 16px;
  width: 100%;
  position: relative;
}

/* ===== SIDEBARS (slide in/out) ===== */
.sidebar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 16px;
  height: calc(100vh - 32px);
  overflow: auto;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.sidebar h3 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
}

.sidebar-left {
  transform: translateX(0);
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.sidebar-right {
  transform: translateX(0);
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.sidebar-left.closed {
  transform: translateX(-105%);
  opacity: 0;
  pointer-events: none;
}
.sidebar-right.closed {
  transform: translateX(105%);
  opacity: 0;
  pointer-events: none;
}

/* ===== OPEN TABS ===== */
.open-tab {
  position: fixed;
  top: 90px;
  z-index: 9991;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #0f172a;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
}
.open-tab.left {
  left: 10px;
}
.open-tab.right {
  right: 10px;
}

/* ===== CENTER BOX ===== */
.box.center {
  background: #fff;
  border-radius: 12px;
  padding: 14px 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* ===== FORM ===== */
label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin: 6px 0 4px;
}
input,
textarea,
select {
  width: 100%;
  padding: 7px 9px;
  margin-bottom: 8px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  background: #fff;
  color: #0f172a;
  box-sizing: border-box;
}
input:focus,
textarea:focus,
select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
textarea {
  min-height: 64px;
  resize: vertical;
}

/* ===== BUTTONS ===== */
button {
  padding: 7px 10px;
  font-size: 13px;
  margin-bottom: 6px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  color: #0f172a;
}
button:hover {
  background: #eef2f7;
}
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
button.primary {
  background: #2563eb;
  color: #fff;
  border: none;
}
button.primary:hover {
  background: #1d4ed8;
}
button.ghost {
  background: #0f172a;
  color: #fff;
  border: none;
}
button.ghost:hover {
  background: #111c33;
}

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 10px 0;
}

/* ===== TOP BAR ===== */
.top-bar {
  display: grid;
  grid-template-columns: 140px 1fr 180px 160px;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.top-bar input {
  margin-bottom: 0;
}
.select {
  margin-bottom: 0;
}

/* ===== PRODUCT GRID ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.card {
  border: 1px solid #e5e7eb;
  padding: 10px;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}
.card img {
  width: 100%;
  height: 130px;
  object-fit: contain;
  background: #f8fafc;
  border-radius: 10px;
}
.card h4 {
  margin: 0;
  font-size: 14px;
  color: #0f172a;
  line-height: 1.2;
}
.card p {
  margin: 0;
  font-size: 12px;
  color: #475569;
}
.price {
  font-weight: 800;
  color: #0f172a;
}
.muted {
  color: #64748b;
  font-size: 12px;
}
.clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.qty {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}
.qty button {
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border-radius: 8px;
}
.qty span {
  min-width: 18px;
  text-align: center;
  font-weight: 800;
  color: #0f172a;
}
.btn-add {
  margin-top: 6px;
  background: #0ea5e9;
  border: none;
  color: #fff;
}
.btn-add:hover {
  background: #0284c7;
}

/* ===== TOTALS ===== */
.totals {
  margin-top: 10px;
  padding: 10px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}
.mini {
  margin-top: 8px;
  font-size: 13px;
  color: #0f172a;
}

/* ===== MODAL ===== */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 18px;
}
.modal-card {
  background: #fff;
  color: #0f172a;
  padding: 16px;
  width: 560px;
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.3);
}
.modal-card.modal-wide {
  width: min(1120px, 96vw);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.modal-head h3 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}
.modal-head .x {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 10px;
}
.preview {
  width: 100%;
  height: 220px;
  object-fit: contain;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.grid3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

/* ===== QUOTE MODAL ===== */
.modal-quote {
  max-height: 86vh;
}
.hint {
  font-size: 12px;
  color: #475569;
  margin-bottom: 8px;
}
.quote-table-wrap {
  max-height: 52vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.totals-quote {
  margin-top: 10px;
}

/* ===== TABLE ===== */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 8px;
  vertical-align: top;
}
thead th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 800;
  border-bottom: 1px solid #e5e7eb;
  z-index: 1;
}
.right {
  text-align: right;
}
.nowrap {
  white-space: nowrap;
}
.preline {
  white-space: pre-line;
}
td.desc {
  color: #0f172a;
}
td.desc .preline > div {
  margin-bottom: 6px;
}

/* ===== GROUP ROW giống ảnh ===== */
.group-row td {
  background: #d1fae5; /* xanh nhạt như excel */
  border-bottom: 1px solid #a7f3d0;
  font-weight: 900;
  color: #064e3b;
}
.group-stt {
  width: 52px;
  text-align: center;
}
.group-title {
  padding-left: 10px;
}

/* ===== column widths ===== */
.col-stt { width: 52px; }
.col-name { width: 220px; }
.col-desc { width: 320px; }
.col-sl { width: 80px; }
.col-dvt { width: 90px; }
.col-dg { width: 120px; }
.col-vat { width: 90px; }
.col-tt { width: 130px; }
.col-loi { width: 170px; }

.cell-input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 12px;
  margin: 0;
  box-sizing: border-box;
}
td.dvt {
  min-width: 90px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1180px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: relative;
    height: auto;
    top: 0;
  }
  .open-tab {
    top: auto;
    bottom: 80px;
  }
  .top-bar {
    grid-template-columns: 1fr;
  }
  /* quote row clickable */
.quote-item-row {
  cursor: pointer;
}
.quote-item-row:hover td {
  background: #f8fafc;
}

/* delete column */
.col-del {
  width: 70px;
}
.center {
  text-align: center;
}

.btn-del {
  background: #ef4444 !important;
  color: #fff !important;
  border: none !important;
}
.btn-del:hover {
  background: #dc2626 !important;
}



}
</style>
